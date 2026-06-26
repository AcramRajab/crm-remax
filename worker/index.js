// Worker do crm-remax.
// - Serve os assets (CRM + Landing Pages) via binding ASSETS.
// - Expõe POST /api/lead: ingestão server-side de leads (anti-spoof).
//   A conta NÃO vem do browser — é resolvida pelo HOSTNAME no servidor.
//   Grava no Supabase com a service_role (bypassa RLS; só roda no servidor).

const SUPABASE_URL = "https://plbzwswqkeozvyirzqma.supabase.co";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await handleLead(request, env, url);
      } catch (err) {
        return json({ error: "server_error", detail: String(err && err.message || err) }, 500);
      }
    }

    // Convidar membro da equipe (só admin da conta). Cria o usuário NA CONTA DO
    // ADMIN — account_id vem do token verificado, nunca do browser.
    if (url.pathname === "/api/team/invite") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await handleInvite(request, env);
      } catch (err) {
        return json({ error: "server_error", detail: String(err && err.message || err) }, 500);
      }
    }

    // Demais caminhos: assets (run_worker_first manda só /api/* pra cá).
    return env.ASSETS.fetch(request);
  }
};

async function handleLead(request, env, url) {
  if (!env.SUPABASE_SERVICE_ROLE) return json({ error: "missing_service_role" }, 500);

  let data;
  try { data = await request.json(); }
  catch { return json({ error: "bad_json" }, 400); }

  const sb = supa(env);
  const host = url.hostname;
  const slug = String(data.slug || "").trim();

  // 1) Conta pelo HOSTNAME (não confia em account_id do browser).
  const contas = await sb(`core_contas?custom_domain=eq.${encodeURIComponent(host)}&select=id&limit=1`);
  if (!contas.length) return json({ error: "conta_nao_encontrada", host }, 404);
  const account_id = contas[0].id;

  // 2) Empreendimento por (conta, slug).
  let empreendimento_id = null;
  if (slug) {
    const emps = await sb(`core_empreendimentos?account_id=eq.${account_id}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
    if (emps.length) empreendimento_id = emps[0].id;
  }

  // 3) Lead.
  const nome = String(data.nome || "").trim();
  const parts = nome.split(/\s+/).filter(Boolean);
  const first_name = parts.shift() || null;
  const last_name = parts.length ? parts.join(" ") : null;

  await sb("crm_leads", { method: "POST", body: {
    account_id, empreendimento_id,
    email: data.email || null,
    phone: data.telefone || null,
    first_name, last_name,
    origin: "inbound",
    journey: { channel: "form", interesse: data.interesse || null }
  }});

  // 4) Evento Lead (também alimenta track_eventos).
  await sb("track_eventos", { method: "POST", body: {
    account_id, empreendimento_id, slug,
    event_id: crypto.randomUUID(),
    event_name: "Lead",
    page_url: data.page_url || null,
    properties: { channel: "form", interesse: data.interesse || null }
  }});

  return json({ ok: true });
}

async function handleInvite(request, env) {
  if (!env.SUPABASE_SERVICE_ROLE) return json({ error: "missing_service_role" }, 500);

  // 1) Valida quem está chamando (admin logado) pelo token do browser.
  const authz = request.headers.get("Authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return json({ error: "no_token" }, 401);

  const caller = await validateCaller(env, token);
  if (!caller) return json({ error: "invalid_token" }, 401);
  const isAdmin = caller.user_role === "account_admin" || caller.is_super_admin;
  if (!isAdmin || !caller.account_id) return json({ error: "forbidden" }, 403);

  // 2) Dados do convite.
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim() || null;
  let role = String(body.role || "broker").trim();
  if (role !== "broker" && role !== "account_admin") role = "broker";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "email_invalido" }, 400);

  // 3) Cria o usuário NA CONTA DO ADMIN (account_id do token, não do body).
  //    O trigger handle_new_user lê o metadata e cria a associação core_usuarios.
  const tempPassword = "Acesso-" + crypto.randomUUID().slice(0, 8);
  const res = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { account_id: caller.account_id, role, name },
    }),
  });

  if (!res.ok) {
    const txt = (await res.text()).slice(0, 300);
    if (res.status === 422 || res.status === 409 || /already|exists|registered/i.test(txt)) {
      return json({ error: "ja_existe", detail: "Esse e-mail já tem cadastro na plataforma." }, 409);
    }
    return json({ error: "criar_usuario_falhou", detail: txt }, 500);
  }

  return json({ ok: true, email, role, temp_password: tempPassword });
}

// Valida o access token do admin no Supabase (assinatura + expiração) e lê os
// claims custom (account_id / user_role / is_super_admin) do payload do JWT.
async function validateCaller(env, token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: "Bearer " + token },
  });
  if (!r.ok) return null; // token inválido/expirado -> Supabase recusa
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    account_id: claims.account_id || null,
    user_role: claims.user_role || null,
    is_super_admin: !!claims.is_super_admin,
  };
}

function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    return JSON.parse(atob(b64 + pad));
  } catch { return null; }
}

// Cliente REST do Supabase com service_role (server-side; bypassa RLS).
function supa(env) {
  const key = env.SUPABASE_SERVICE_ROLE;
  return async (pathOrTable, opts = {}) => {
    const isWrite = !!opts.method;
    const headers = { apikey: key, Authorization: "Bearer " + key };
    if (isWrite) { headers["Content-Type"] = "application/json"; headers["Prefer"] = "return=minimal"; }
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + pathOrTable, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!r.ok) throw new Error("supabase " + r.status + ": " + (await r.text()).slice(0, 200));
    return isWrite ? null : r.json();
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

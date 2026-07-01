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

    // Enviar e-mail avulso do lead (corretor logado). Envia via Resend do
    // remetente da conta; reply-to = e-mail do corretor.
    if (url.pathname === "/api/email/send") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await handleSendEmail(request, env);
      } catch (err) {
        return json({ error: "server_error", detail: String(err && err.message || err) }, 500);
      }
    }

    // Cadastro de indicador (corretor externo self-service). Público: resolve a
    // conta pelo hostname, gera o ref_code e devolve o link de indicação.
    if (url.pathname === "/api/corretor") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await handleCorretor(request, env, url);
      } catch (err) {
        return json({ error: "server_error", detail: String(err && err.message || err) }, 500);
      }
    }

    // Demais caminhos: assets (run_worker_first manda só /api/* pra cá).
    return env.ASSETS.fetch(request);
  },

  // Cron (ver wrangler.toml [triggers]): processa sequências + automações.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([processSequences(env), processAutomacoes(env)]));
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

  // 3) Atribuição por ?c=<ref_code> no link de divulgação. Duas origens:
  //    - EQUIPE interna (core_usuarios) -> vira owner_id do lead (ele trabalha no CRM).
  //    - INDICADOR externo (crm_indicadores) -> registra quem indicou no journey
  //      (parceiro de outra imobiliária; o lead segue a distribuição do time).
  //    Tudo em try/catch: rastreio nunca pode derrubar a captura do lead.
  const ref = String(data.corretor || data.c || "").trim().toLowerCase();
  let owner_id = null;
  let indicador = null;
  if (ref) {
    try {
      const us = await sb(`core_usuarios?account_id=eq.${account_id}&ref_code=eq.${encodeURIComponent(ref)}&select=user_id&limit=1`);
      if (us.length) owner_id = us[0].user_id;
      else {
        const ind = await sb(`crm_indicadores?account_id=eq.${account_id}&ref_code=eq.${encodeURIComponent(ref)}&select=id,nome,imobiliaria,telefone&limit=1`);
        if (ind.length) indicador = ind[0];
      }
    } catch (e) { /* coluna/tabela ainda não migrada: ignora e segue */ }
  }

  // 4) Lead.
  const nome = String(data.nome || "").trim();
  const parts = nome.split(/\s+/).filter(Boolean);
  const first_name = parts.shift() || null;
  const last_name = parts.length ? parts.join(" ") : null;

  const channel = String(data.channel || "form");
  const journey = {
    channel,
    interesse: data.interesse || null,
    corretor_ref: ref || null,
    indicador: indicador ? { nome: indicador.nome, imobiliaria: indicador.imobiliaria, telefone: indicador.telefone } : null
  };

  await sb("crm_leads", { method: "POST", body: {
    account_id, empreendimento_id,
    email: data.email || null,
    phone: data.telefone || null,
    first_name, last_name,
    origin: indicador ? "indicacao" : "inbound",
    owner_id,
    journey
  }});

  // 5) Evento Lead (também alimenta track_eventos).
  await sb("track_eventos", { method: "POST", body: {
    account_id, empreendimento_id, slug,
    event_id: crypto.randomUUID(),
    event_name: "Lead",
    page_url: data.page_url || null,
    properties: { channel, interesse: data.interesse || null, corretor_ref: ref || null }
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

// Cadastro de indicador (corretor externo). Público — a conta vem do HOSTNAME.
// Gera o ref_code e devolve o link de indicação pra LP oficial.
async function handleCorretor(request, env, url) {
  if (!env.SUPABASE_SERVICE_ROLE) return json({ error: "missing_service_role" }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ error: "bad_json" }, 400); }

  const nome = String(data.nome || "").trim();
  const telefone = String(data.telefone || "").trim();
  const imobiliaria = String(data.imobiliaria || "").trim();
  if (nome.length < 2) return json({ error: "nome_obrigatorio" }, 400);

  const sb = supa(env);
  const host = url.hostname;
  const slug = String(data.slug || "").trim();

  // Conta pelo HOSTNAME (não confia no browser).
  const contas = await sb(`core_contas?custom_domain=eq.${encodeURIComponent(host)}&select=id&limit=1`);
  if (!contas.length) return json({ error: "conta_nao_encontrada", host }, 404);
  const account_id = contas[0].id;

  let empreendimento_id = null;
  if (slug) {
    const emps = await sb(`core_empreendimentos?account_id=eq.${account_id}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
    if (emps.length) empreendimento_id = emps[0].id;
  }

  // Gera o ref_code único (equipe + indicadores) e insere — tudo na RPC (atômico).
  const ref_code = await rpc(env, "criar_indicador", {
    p_account: account_id, p_emp: empreendimento_id,
    p_nome: nome, p_telefone: telefone || null, p_imobiliaria: imobiliaria || null
  });

  const base = slug ? `/${slug}` : "";
  const link = `https://${host}${base}?c=${ref_code}`;
  return json({ ok: true, ref_code, link });
}

// Envia um e-mail avulso do lead (corretor logado) via Resend.
async function handleSendEmail(request, env) {
  if (!env.SUPABASE_SERVICE_ROLE) return json({ error: "missing_service_role" }, 500);
  if (!env.RESEND_API_KEY) return json({ error: "sem_resend", detail: "RESEND_API_KEY não configurada no Worker." }, 400);

  const authz = request.headers.get("Authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return json({ error: "no_token" }, 401);
  const caller = await validateCaller(env, token);
  if (!caller || !caller.account_id) return json({ error: "forbidden" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim();
  const corpo = String(body.body || "");
  const lead_id = body.lead_id || null;
  if (!to || !subject) return json({ error: "faltam_campos" }, 400);

  const sb = supa(env);
  const conta = (await sb(`core_contas?id=eq.${caller.account_id}&select=email_remetente,email_remetente_nome,email_ativo&limit=1`))[0] || {};
  if (!conta.email_ativo || !conta.email_remetente) {
    return json({ error: "email_nao_configurado", detail: "Configure o remetente em Automações e ative o e-mail." }, 400);
  }

  let provider_id = null;
  try {
    const res = await sendEmail(env, {
      from: conta.email_remetente, fromName: conta.email_remetente_nome,
      to, subject, html: corpoToHtml(corpo), replyTo: caller.email || null,
    });
    provider_id = (res && res.id) || null;
  } catch (e) {
    return json({ error: "envio_falhou", detail: String(e && e.message || e).slice(0, 300) }, 502);
  }

  if (lead_id) {
    await sb("crm_atividades", { method: "POST", body: {
      account_id: caller.account_id, lead_id, actor_id: null, kind: "email", detail: { to, subject, provider_id },
    }});
  }
  return json({ ok: true, provider_id });
}

// Chama uma função Postgres via PostgREST RPC (service_role).
async function rpc(env, fn, args) {
  const key = env.SUPABASE_SERVICE_ROLE;
  const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error("rpc " + fn + " " + r.status + ": " + (await r.text()).slice(0, 200));
  return r.json();
}

// Valida o access token do admin no Supabase (assinatura + expiração) e lê os
// claims custom (account_id / user_role / is_super_admin) do payload do JWT.
async function validateCaller(env, token) {
  const r = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: "Bearer " + token },
  });
  if (!r.ok) return null; // token inválido/expirado -> Supabase recusa
  const user = await r.json().catch(() => null);
  const claims = decodeJwt(token);
  if (!claims) return null;
  return {
    account_id: claims.account_id || null,
    user_role: claims.user_role || null,
    is_super_admin: !!claims.is_super_admin,
    email: (user && user.email) || null,
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

// ===================== MOTOR DE SEQUÊNCIAS (cron) =====================
// Percorre a fila de inscrições vencidas e envia o próximo e-mail via Resend.
// Só envia se a conta tiver e-mail ativo/remetente e o Worker tiver RESEND_API_KEY.
async function processSequences(env) {
  if (!env.SUPABASE_SERVICE_ROLE) return;
  const sb = supa(env);
  const nowIso = new Date().toISOString();
  const fila = await sb(`crm_sequencia_inscricoes?status=eq.ativa&proximo_envio_at=lte.${encodeURIComponent(nowIso)}&select=*&order=proximo_envio_at.asc&limit=50`);
  for (const ins of fila) {
    try { await processInscricao(env, sb, ins); }
    catch (e) { console.error("seq inscricao", ins.id, String(e && e.message || e)); }
  }
}

async function processInscricao(env, sb, ins) {
  const now = () => new Date().toISOString();
  const seq = (await sb(`crm_sequencias?id=eq.${ins.sequencia_id}&select=id,ativo&limit=1`))[0];
  if (!seq || !seq.ativo) {
    await sb(`crm_sequencia_inscricoes?id=eq.${ins.id}`, { method: "PATCH", body: { status: "cancelada", updated_at: now() } });
    return;
  }
  const passo = (await sb(`crm_sequencia_passos?sequencia_id=eq.${ins.sequencia_id}&posicao=eq.${ins.passo_idx}&select=*&limit=1`))[0];
  if (!passo) {
    await sb(`crm_sequencia_inscricoes?id=eq.${ins.id}`, { method: "PATCH", body: { status: "concluida", updated_at: now() } });
    return;
  }
  const lead = (await sb(`crm_leads?id=eq.${ins.lead_id}&select=id,email,first_name,last_name&limit=1`))[0];
  const conta = (await sb(`core_contas?id=eq.${ins.account_id}&select=email_remetente,email_remetente_nome,email_ativo&limit=1`))[0] || {};

  // Lead sem e-mail: pula este passo (avança sem enviar).
  if (!lead || !lead.email) { await advanceInscricao(sb, ins); return; }
  // Sem configuração de envio: NÃO avança (fica na fila até configurar). Nada fake.
  if (!env.RESEND_API_KEY || !conta.email_ativo || !conta.email_remetente) return;

  const first = (lead.first_name || "").trim();
  const full = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  const vars = { "{{primeiro_nome}}": first || "tudo bem", "{{nome}}": full || first || "" };
  const assunto = renderTpl(passo.assunto, vars);
  const html = corpoToHtml(renderTpl(passo.corpo, vars));

  let status = "enviado", provider_id = null, erro = null;
  try {
    const res = await sendEmail(env, { from: conta.email_remetente, fromName: conta.email_remetente_nome, to: lead.email, subject: assunto, html });
    provider_id = (res && res.id) || null;
  } catch (e) { status = "falhou"; erro = String(e && e.message || e).slice(0, 300); }

  await sb("crm_sequencia_envios", { method: "POST", body: {
    account_id: ins.account_id, inscricao_id: ins.id, sequencia_id: ins.sequencia_id,
    passo_id: passo.id, lead_id: ins.lead_id, assunto, status, provider_id, erro
  }});
  await advanceInscricao(sb, ins);
}

async function advanceInscricao(sb, ins) {
  const nextPos = ins.passo_idx + 1;
  const next = (await sb(`crm_sequencia_passos?sequencia_id=eq.${ins.sequencia_id}&posicao=eq.${nextPos}&select=delay_horas&limit=1`))[0];
  const patch = { updated_at: new Date().toISOString() };
  if (next) {
    patch.passo_idx = nextPos;
    patch.proximo_envio_at = new Date(Date.now() + (next.delay_horas || 0) * 3600 * 1000).toISOString();
  } else {
    patch.status = "concluida";
  }
  await sb(`crm_sequencia_inscricoes?id=eq.${ins.id}`, { method: "PATCH", body: patch });
}

// ===================== MOTOR DE AUTOMAÇÕES (gatilho -> ações) =====================
async function processAutomacoes(env) {
  if (!env.SUPABASE_SERVICE_ROLE) return;
  const sb = supa(env);
  const nowIso = new Date().toISOString();
  const fila = await sb(`crm_automacao_execucoes?status=eq.ativa&proximo_at=lte.${encodeURIComponent(nowIso)}&select=*&order=proximo_at.asc&limit=50`);
  for (const ex of fila) {
    try { await processExecucao(env, sb, ex); }
    catch (e) { console.error("automacao exec", ex.id, String(e && e.message || e)); }
  }
}

async function processExecucao(env, sb, ex) {
  const now = () => new Date().toISOString();
  const auto = (await sb(`crm_automacoes?id=eq.${ex.automacao_id}&select=id,ativo&limit=1`))[0];
  if (!auto || !auto.ativo) { await sb(`crm_automacao_execucoes?id=eq.${ex.id}`, { method: "PATCH", body: { status: "cancelada", updated_at: now() } }); return; }
  const acao = (await sb(`crm_automacao_acoes?automacao_id=eq.${ex.automacao_id}&posicao=eq.${ex.acao_idx}&select=*&limit=1`))[0];
  if (!acao) { await sb(`crm_automacao_execucoes?id=eq.${ex.id}`, { method: "PATCH", body: { status: "concluida", updated_at: now() } }); return; }
  const lead = (await sb(`crm_leads?id=eq.${ex.lead_id}&select=*&limit=1`))[0];
  if (!lead) { await sb(`crm_automacao_execucoes?id=eq.${ex.id}`, { method: "PATCH", body: { status: "cancelada", updated_at: now() } }); return; }

  // "aguardar": agenda o próximo passo e sai (não roda mais nada agora).
  if (acao.tipo === "aguardar") {
    const horas = Number((acao.config || {}).horas || 0);
    await sb(`crm_automacao_execucoes?id=eq.${ex.id}`, { method: "PATCH", body: {
      acao_idx: ex.acao_idx + 1, proximo_at: new Date(Date.now() + horas * 3600 * 1000).toISOString(), updated_at: now(),
    }});
    return;
  }

  await executeAcao(env, sb, ex, acao, lead);
  await sb(`crm_automacao_execucoes?id=eq.${ex.id}`, { method: "PATCH", body: { acao_idx: ex.acao_idx + 1, proximo_at: now(), updated_at: now() } });
}

async function executeAcao(env, sb, ex, acao, lead) {
  const c = acao.config || {};
  const acc = ex.account_id;
  const log = (kind, detail) => sb("crm_atividades", { method: "POST", body: { account_id: acc, lead_id: ex.lead_id, actor_id: null, kind, detail } });

  switch (acao.tipo) {
    case "enviar_email": {
      if (!env.RESEND_API_KEY || !lead.email) return;
      const conta = (await sb(`core_contas?id=eq.${acc}&select=email_remetente,email_remetente_nome,email_ativo&limit=1`))[0] || {};
      if (!conta.email_ativo || !conta.email_remetente) return;
      const first = (lead.first_name || "").trim();
      const vars = { "{{primeiro_nome}}": first || "tudo bem", "{{nome}}": [lead.first_name, lead.last_name].filter(Boolean).join(" ") || first };
      try {
        const r = await sendEmail(env, { from: conta.email_remetente, fromName: conta.email_remetente_nome, to: lead.email, subject: renderTpl(c.assunto || "", vars), html: corpoToHtml(renderTpl(c.corpo || "", vars)) });
        await log("email", { to: lead.email, subject: c.assunto, provider_id: (r && r.id) || null, auto: true });
      } catch (e) { await log("email", { to: lead.email, subject: c.assunto, erro: String(e && e.message || e).slice(0, 200) }); }
      return;
    }
    case "adicionar_tag": {
      const tag = String(c.tag || "").trim(); if (!tag) return;
      const tags = Array.from(new Set([...(lead.tags || []), tag]));
      await sb(`crm_leads?id=eq.${lead.id}`, { method: "PATCH", body: { tags } }); await log("tag", { add: tag }); return;
    }
    case "remover_tag": {
      const tag = String(c.tag || "").trim(); if (!tag) return;
      const tags = (lead.tags || []).filter((t) => t !== tag);
      await sb(`crm_leads?id=eq.${lead.id}`, { method: "PATCH", body: { tags } }); await log("tag", { remove: tag }); return;
    }
    case "atualizar_campo": {
      const campo = c.campo; if (!campo) return;
      const campos = Object.assign({}, lead.campos || {}, { [campo]: c.valor });
      await sb(`crm_leads?id=eq.${lead.id}`, { method: "PATCH", body: { campos } }); await log("campo", { campo, valor: c.valor }); return;
    }
    case "alterar_score": {
      const val = Number(c.valor || 0);
      const novo = (c.modo === "add") ? (Number(lead.score || 0) + val) : val;
      await sb(`crm_leads?id=eq.${lead.id}`, { method: "PATCH", body: { score: novo } }); await log("score", { score: novo }); return;
    }
    case "webhook": {
      const url = String(c.url || ""); if (!/^https?:\/\//.test(url)) return;
      try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, automacao_id: ex.automacao_id }) }); await log("webhook", { url }); }
      catch (e) { await log("webhook", { url, erro: String(e && e.message || e).slice(0, 150) }); }
      return;
    }
    case "notificar": {
      await log("notificacao", { mensagem: c.mensagem || "" }); return;
    }
    default:
      // add_segmento / remove_segmento e afins: sem infra ainda — registra e segue.
      await log("acao_pulada", { tipo: acao.tipo }); return;
  }
}

function renderTpl(tpl, vars) {
  let s = String(tpl || "");
  for (const k in vars) s = s.split(k).join(vars[k]);
  return s;
}

function corpoToHtml(text) {
  const esc = String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = esc.replace(/\\n/g, "<br>").replace(/\n/g, "<br>");
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222">' + body + "</div>";
}

async function sendEmail(env, { from, fromName, to, subject, html, replyTo }) {
  const fromHeader = fromName ? `${fromName} <${from}>` : from;
  const payload = { from: fromHeader, to: [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("resend " + r.status + ": " + (await r.text()).slice(0, 200));
  return r.json();
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

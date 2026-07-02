/* =========================================================================
   NOW Residence — Tracking Config (V2 multi-tenant)
   -------------------------------------------------------------------------
   A LP nasce conectada ao tracking. ESTE arquivo carimba a CONTA e o
   EMPREENDIMENTO em TODO evento (ver planning/04-tracking-e-stitching.md).

   Regras (CLAUDE.md):
   - account_id + slug viajam em CADA evento (carimbados na origem).
   - O slug é a chave de negócio do empreendimento, único por conta.
   - O n8n RE-VALIDA a conta no server (anti-spoof) — nunca confiar no browser.
   - Preset imobiliário: lead-gen-hibrido (form + clique WhatsApp).
   ========================================================================= */
window.NOW_TRACKING = {
  // 🔑 TENANT — preencher no onboarding (skills/onboarding-cliente)
  account_id: "REPLACE_ACCOUNT_ID",      // conta REMAX (uuid no Supabase)
  slug: "now-residence",                  // empreendimento (único por conta)
  account_name: "REMAX",                  // só rótulo; segurança é account_id

  // Endpoint de ingestão (n8n) — ver n8n/01-tracking-ingest
  ingest_url: "REPLACE_N8N_INGEST_URL",

  // Preset de captura
  preset: "lead-gen-hibrido",

  // Pixels DO CLIENTE (credenciais da conta REMAX) — preencher no onboarding
  pixels: {
    meta_pixel_id: "REPLACE_META_PIXEL_ID",
    ga4_id: "REPLACE_GA4_ID",
    tiktok_id: "",
    clarity_id: ""
  },

  // WhatsApp de conversão (clique = evento Lead, action_source business_messaging)
  whatsapp: {
    number: "5547992012292",              // número comercial do Boat Show
    message: "Olá! Quero as condições exclusivas do NOW Residence no Boat Show Itajaí."
  }
};

/* CORRETOR (atribuição): cada corretor divulga .../now-residence?c=<ref_code>.
   Capturamos o ?c= na entrada e guardamos (sobrevive à navegação e ao retorno
   pelo e-mail/WhatsApp). Vai junto no form -> o Worker resolve para o owner do
   lead no CRM. Sem ?c=, segue a distribuição normal. */
(function () {
  var KEY = "now_corretor";
  var ref = "";
  try {
    var q = new URLSearchParams(location.search);
    ref = (q.get("c") || q.get("corretor") || "").trim().toLowerCase();
    if (ref) localStorage.setItem(KEY, ref);
    else ref = (localStorage.getItem(KEY) || "").trim().toLowerCase();
  } catch (e) {}
  window.NOW_TRACKING.corretor = ref || null;
})();

/* Stub mínimo de captura. Quando o tracking-kit for integrado (decisão
   aberta #5: cópia vs submódulo), ele substitui este stub e usa o mesmo
   NOW_TRACKING acima. Por ora garante que account_id + slug viajam. */
(function () {
  var cfg = window.NOW_TRACKING;

  function track(eventName, props) {
    var payload = {
      event_id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
      event_name: eventName,
      account_id: cfg.account_id,     // carimbo de tenant
      slug: cfg.slug,                 // carimbo de empreendimento
      client_name: cfg.slug,          // compat tracking-kit
      page_url: location.href,
      referrer: document.referrer,
      ts: new Date().toISOString(),
      properties: props || {}
    };
    // Não bloqueia a UI; o n8n valida/carimba a conta e grava em tracking_events.
    if (cfg.ingest_url && cfg.ingest_url.indexOf("REPLACE") === -1 && navigator.sendBeacon) {
      try { navigator.sendBeacon(cfg.ingest_url, JSON.stringify(payload)); } catch (e) {}
    }
    if (window.console) console.debug("[NOW track]", eventName, payload);
    return payload;
  }

  window.NOW_TRACK = track;
  document.addEventListener("DOMContentLoaded", function () { track("PageView"); });
})();

/* UTM / atribuição: captura utm_* + gclid/fbclid da URL. Guarda first-touch
   (nunca sobrescreve) e last-touch (sempre atualiza) no localStorage, pra
   viajar no payload do lead mesmo que o cara navegue antes de converter. */
(function () {
  function readUtm() {
    var q = new URLSearchParams(location.search), u = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
      var v = q.get(k); if (v) u[k] = v;
    });
    var g = q.get("gclid"), f = q.get("fbclid");
    if (g) u.gclid = g; if (f) u.fbclid = f;
    return u;
  }
  var cur = readUtm(), has = Object.keys(cur).length > 0, ft = {}, lt = {};
  try {
    if (has && !localStorage.getItem("now_utm_ft")) localStorage.setItem("now_utm_ft", JSON.stringify(cur));
    if (has) localStorage.setItem("now_utm_lt", JSON.stringify(cur));
    ft = JSON.parse(localStorage.getItem("now_utm_ft") || "{}");
    lt = JSON.parse(localStorage.getItem("now_utm_lt") || "{}");
  } catch (e) {}
  window.NOW_TRACKING.utm_ft = Object.keys(ft).length ? ft : cur;
  window.NOW_TRACKING.utm_lt = Object.keys(lt).length ? lt : cur;
})();

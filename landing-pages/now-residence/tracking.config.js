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
    number: "5547000000000",              // REPLACE com o número comercial
    message: "Olá! Tenho interesse no NOW Residence. Quero saber mais."
  }
};

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

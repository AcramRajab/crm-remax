-- =============================================================================
-- 09 — dossie (gerado por IA na entrada do lead — ADR 0005)
-- DRAFT v0. Revisar antes de produção.
-- =============================================================================

create table if not exists public.dossie (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,

  content       text not null,           -- texto acionável para o corretor
  model         text,                    -- modelo usado via OpenRouter
  sources       jsonb not null default '{}'::jsonb,  -- o que Apify/Firecrawl trouxeram
  is_public_estimate boolean not null default true,  -- LGPD: marcar info pública estimada

  generated_at  timestamptz not null default now(),

  constraint ux_dossie_lead unique (lead_id)   -- 1 dossiê por lead (cacheado; regenerar = update)
);
create index if not exists ix_dossie_lead on public.dossie (lead_id);

comment on table public.dossie is 'Dossiê IA cacheado por lead. Gerado no n8n/server-side na entrada do lead. Regenerar só sob pedido.';

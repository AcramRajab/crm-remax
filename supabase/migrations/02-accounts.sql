-- =============================================================================
-- 02 — accounts (tenant do white-label)
-- DRAFT v0. Revisar antes de produção.
-- =============================================================================

create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,          -- slug da CONTA (global, usado em URLs internas)
  name            text not null,
  status          text not null default 'active', -- active | suspended

  -- white-label
  brand_name      text,
  logo_url        text,
  primary_color   text,
  custom_domain   text unique,                    -- domínio do CRM (Cloudflare for SaaS)

  -- regra de distribuição de leads (configurável por conta)
  -- ex.: {"type":"round_robin"} | {"type":"by_persona"} | {"type":"pool"}
  lead_distribution_rule jsonb not null default '{"type":"round_robin"}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists ix_accounts_custom_domain on public.accounts (custom_domain);

-- ---------------------------------------------------------------------------
-- Credenciais de marketing DO CLIENTE.
-- ⚠️ NÃO guardar tokens sensíveis em texto puro. Preferir Supabase Vault ou
--    secrets do n8n por tenant. Esta tabela guarda só IDs públicos; o token
--    CAPI/refresh fica no Vault (referência por chave).
-- ---------------------------------------------------------------------------
create table if not exists public.account_marketing_credentials (
  account_id        uuid primary key references public.accounts(id) on delete cascade,
  meta_pixel_id     text,
  meta_capi_token_ref text,       -- referência ao secret, não o token
  google_ads_id     text,
  ga4_id            text,
  tiktok_id         text,
  clarity_id        text,
  updated_at        timestamptz not null default now()
);

comment on table public.accounts is 'Conta = imobiliária/cliente. Tenant do white-label.';
comment on column public.accounts.custom_domain is 'Domínio do CRM. Só resolve a conta na entrada; nunca é chave de dado.';

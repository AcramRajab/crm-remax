-- =============================================================================
-- 05 — tracking_events (base do tracking-kit + extensão multi-tenant)
-- DRAFT v0. Revisar antes de produção.
-- Schema base: rodrigoosouza/tracking-kit (server/supabase/01-schema.sql).
-- AQUI adicionamos account_id + empreendimento_id explícitos (ADR 0001/0002).
-- =============================================================================

create table if not exists public.tracking_events (
  id                uuid primary key default gen_random_uuid(),
  kit_version       text,

  -- 🔑 TENANT (multi-tenant): explícitos, carimbados na origem e validados no n8n
  account_id        uuid not null references public.accounts(id),
  empreendimento_id uuid references public.empreendimentos(id),
  client_name       text not null,   -- compat tracking-kit: guarda o SLUG do empreendimento

  -- identificação
  event_id          text not null,   -- UUID do browser (dedup browser↔servidor)
  event_name        text not null,   -- PageView, Lead, Purchase, Scroll...
  event_time        timestamptz not null default now(),
  visitor_id        text,
  session_id        text,
  external_id       text,            -- SHA-256(email)

  -- atribuição first-touch
  ft_utm_source text, ft_utm_medium text, ft_utm_campaign text,
  ft_utm_content text, ft_utm_term text, ft_utm_id text,

  -- atribuição last-touch
  lt_utm_source text, lt_utm_medium text, lt_utm_campaign text,
  lt_utm_content text, lt_utm_term text, lt_utm_id text,

  -- click IDs
  gclid text, gbraid text, wbraid text, gad_campaignid text, gad_source text,
  fbclid text, ctwa_clid text, ttclid text, msclkid text, li_fat_id text,
  twclid text, sck text,

  -- cookies de plataforma
  fbp text, fbc text, ttp text, ga_client_id text,

  -- lead / identidade
  email text, email_hash text, phone text, phone_hash text,
  first_name text, last_name text,

  -- geo / device / página (resumido — ver schema do kit p/ completo)
  geo_city text, geo_state text, geo_country text, ip_address text, user_agent text,
  page_url text, page_path text, referrer text, landing_page text,
  device_type text, language text, timezone text,

  -- jornada multi-touch (20 toques) + props + raw
  journey     jsonb,
  properties  jsonb,
  raw         jsonb,

  created_at  timestamptz not null default now()
);

-- dedup
create unique index if not exists ux_tracking_events_event_id on public.tracking_events (event_id);

-- 🔑 índice composto multi-tenant (queries do dashboard e do stitching)
create index if not exists ix_tracking_events_tenant_time
  on public.tracking_events (account_id, empreendimento_id, event_time desc);

create index if not exists ix_tracking_events_visitor on public.tracking_events (visitor_id, event_time desc);
create index if not exists ix_tracking_events_email_hash on public.tracking_events (email_hash);
create index if not exists ix_tracking_events_event_name on public.tracking_events (event_name, event_time desc);
create index if not exists ix_tracking_events_props_gin on public.tracking_events using gin (properties);

comment on table public.tracking_events is 'Log append-only de eventos (tracking-kit). NÃO é o CRM. O stitching materializa leads a partir daqui.';
comment on column public.tracking_events.account_id is 'Tenant. Validado/carimbado no n8n — não confiar cegamente no browser.';

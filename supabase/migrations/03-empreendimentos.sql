-- =============================================================================
-- 03 — empreendimentos (vários por conta; slug único POR CONTA)
-- DRAFT v0. Revisar antes de produção.
-- =============================================================================

create table if not exists public.empreendimentos (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id) on delete cascade,

  slug            text not null,                  -- único por conta (ver constraint)
  name            text not null,
  status          text not null default 'active', -- active | paused | archived

  construtora     text,
  landing_page_url text,

  -- ICP / personas do empreendimento (ex.: as 6 do Now Residence)
  personas        jsonb not null default '[]'::jsonb,

  -- dados livres do empreendimento (localização, valores, diferenciais)
  details         jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- 🔑 slug único POR CONTA, não global (ADR 0002)
  constraint ux_empreendimento_account_slug unique (account_id, slug)
);

create index if not exists ix_empreendimentos_account on public.empreendimentos (account_id);

comment on table public.empreendimentos is 'Produto imobiliário. Vários por conta. Chave de negócio: (account_id, slug).';
comment on column public.empreendimentos.slug is 'Único por conta. Carimbado na origem (config da LP), nunca deduzido do domínio.';

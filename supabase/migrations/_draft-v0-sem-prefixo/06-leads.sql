-- =============================================================================
-- 06 — leads (materializado pelo stitching; coração do CRM)
-- DRAFT v0. Revisar antes de produção.
-- A regra de identidade (decisão aberta #2) afeta como leads são criados/mesclados.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum ('active', 'won', 'lost', 'discarded');
  end if;
end $$;

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id) on delete cascade,
  empreendimento_id uuid references public.empreendimentos(id),

  -- identidade
  email             citext,
  phone             text,
  email_hash        text,
  phone_hash        text,
  first_name        text,
  last_name         text,
  visitor_ids       text[] default '{}',   -- acumula os visitor_id mesclados (multi-device)

  -- atribuição consolidada (snapshot)
  origin            text,                  -- inbound | outbound | indicacao
  ft_source text, ft_medium text, ft_campaign text,
  lt_source text, lt_medium text, lt_campaign text,
  journey           jsonb,                 -- snapshot da jornada no momento da conversão

  -- inteligência
  persona           text,                  -- persona estimada
  score             int default 0,

  -- estado no CRM
  stage_id          uuid references public.funnel_stages(id),
  owner_id          uuid references auth.users(id),   -- corretor dono
  status            lead_status not null default 'active',
  discard_reason    text,
  followup_count    int not null default 0,           -- regra 5–12 contatos

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists ix_leads_tenant on public.leads (account_id, empreendimento_id);
create index if not exists ix_leads_owner on public.leads (owner_id);
create index if not exists ix_leads_stage on public.leads (stage_id);
create index if not exists ix_leads_email_hash on public.leads (account_id, email_hash);
create index if not exists ix_leads_phone_hash on public.leads (account_id, phone_hash);

comment on table public.leads is 'Estado mutável. Criado pelo stitching a partir de tracking_events. Identidade resolvida por email_hash→phone_hash (decisão aberta #2).';

-- NOTA: este arquivo referencia funnel_stages (criado em 07-crm.sql).
-- Aplicar 07 junto, ou mover a FK stage_id para depois se aplicar isolado.

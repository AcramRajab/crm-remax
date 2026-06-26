-- =============================================================================
-- 2026-06-26_01 — Fundação multi-tenant (core_ / crm_ / track_)
-- Padrão de nomes: prefixo por domínio.
--   core_*  -> espinha dorsal multi-tenant (compartilhado)
--   crm_*   -> CRM de vendas
--   track_* -> tracking / marketing
-- Regra inquebrável: TODA tabela de domínio tem account_id + RLS por account_id.
-- Aplicar este arquivo inteiro no SQL Editor do Supabase.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- email case-insensitive

-- ---------- enums ----------
do $$ begin
  if not exists (select 1 from pg_type where typname='app_role') then
    create type app_role as enum ('super_admin','account_admin','broker');
  end if;
  if not exists (select 1 from pg_type where typname='lead_status') then
    create type lead_status as enum ('active','won','lost','discarded');
  end if;
end $$;

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- =============================================================================
-- core_ : tenancy
-- =============================================================================

-- core_contas — as imobiliárias (raiz do white-label)
create table if not exists public.core_contas (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,              -- slug da CONTA (global)
  name          text not null,
  status        text not null default 'active',    -- active | suspended

  brand_name    text,
  logo_url      text,
  primary_color text,
  custom_domain text unique,                        -- domínio do CRM (Cloudflare for SaaS)

  lead_distribution_rule jsonb not null default '{"type":"round_robin"}'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- core_empreendimentos — vários por conta; slug único POR CONTA
create table if not exists public.core_empreendimentos (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  slug          text not null,
  name          text not null,
  status        text not null default 'active',    -- active | paused | archived
  construtora   text,
  landing_page_url text,
  personas      jsonb not null default '[]'::jsonb,
  details       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint ux_empre_account_slug unique (account_id, slug)
);
create index if not exists ix_empre_account on public.core_empreendimentos (account_id);

-- core_usuarios — liga auth.users ↔ conta + papel (corretores / admins)
create table if not exists public.core_usuarios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  role        app_role not null default 'broker',
  name        text,
  created_at  timestamptz not null default now(),
  constraint ux_usuario_user_account unique (user_id, account_id)
);
create index if not exists ix_usuarios_account on public.core_usuarios (account_id);
create index if not exists ix_usuarios_user on public.core_usuarios (user_id);

-- =============================================================================
-- track_ : tracking / marketing
-- =============================================================================

-- track_eventos — todo comportamento de navegação (tracking-kit)
create table if not exists public.track_eventos (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.core_contas(id),
  empreendimento_id uuid references public.core_empreendimentos(id),
  slug              text not null,                 -- slug do empreendimento (carimbado na origem)

  event_id          text not null,                 -- UUID do browser (dedup)
  event_name        text not null,                 -- PageView, Lead, ThankYouView...
  event_time        timestamptz not null default now(),
  visitor_id        text,
  session_id        text,
  external_id       text,                          -- SHA-256(email)

  page_url          text,
  referrer          text,
  properties        jsonb not null default '{}'::jsonb,

  created_at        timestamptz not null default now()
);
create index if not exists ix_track_tenant on public.track_eventos (account_id, empreendimento_id);
create index if not exists ix_track_visitor on public.track_eventos (visitor_id);
create index if not exists ix_track_event_name on public.track_eventos (account_id, event_name);

-- =============================================================================
-- crm_ : CRM de vendas
-- =============================================================================

-- crm_funil_etapas — etapas configuráveis por conta (topo|meio|fundo)
create table if not exists public.crm_funil_etapas (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  name        text not null,
  phase       text not null default 'topo',        -- topo | meio | fundo
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  constraint ux_etapa_account_position unique (account_id, position)
);
create index if not exists ix_etapas_account on public.crm_funil_etapas (account_id, position);

-- crm_leads — coração do CRM (materializado a partir dos eventos)
create table if not exists public.crm_leads (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.core_contas(id) on delete cascade,
  empreendimento_id uuid references public.core_empreendimentos(id),

  email             citext,
  phone             text,
  email_hash        text,
  phone_hash        text,
  first_name        text,
  last_name         text,
  visitor_ids       text[] default '{}',

  origin            text,                           -- inbound | outbound | indicacao
  ft_source text, ft_medium text, ft_campaign text,
  lt_source text, lt_medium text, lt_campaign text,
  journey           jsonb,

  persona           text,
  score             int default 0,

  stage_id          uuid references public.crm_funil_etapas(id),
  owner_id          uuid references auth.users(id),
  status            lead_status not null default 'active',
  discard_reason    text,
  followup_count    int not null default 0,         -- regra 5–12 contatos (Acram)

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists ix_leads_tenant on public.crm_leads (account_id, empreendimento_id);
create index if not exists ix_leads_owner on public.crm_leads (owner_id);
create index if not exists ix_leads_stage on public.crm_leads (stage_id);
create index if not exists ix_leads_email_hash on public.crm_leads (account_id, email_hash);
create index if not exists ix_leads_phone_hash on public.crm_leads (account_id, phone_hash);

-- crm_notas — anotações livres do corretor
create table if not exists public.crm_notas (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  author_id   uuid references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists ix_notas_lead on public.crm_notas (lead_id);

-- crm_tarefas — follow-up / próximos contatos
create table if not exists public.crm_tarefas (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  owner_id    uuid references auth.users(id),
  title       text not null,
  due_at      timestamptz,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists ix_tarefas_lead on public.crm_tarefas (lead_id);
create index if not exists ix_tarefas_owner_due on public.crm_tarefas (owner_id, due_at);

-- crm_atividades — timeline do lead (mudou etapa, contato feito, etc.)
create table if not exists public.crm_atividades (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  actor_id    uuid references auth.users(id),
  kind        text not null,                        -- stage_change | contact | note | system
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ix_atividades_lead on public.crm_atividades (lead_id, created_at);

-- ---------- triggers updated_at ----------
do $$
declare t text;
begin
  foreach t in array array['core_contas','core_empreendimentos','crm_leads'] loop
    execute format('drop trigger if exists trg_updated_at on public.%I;', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =============================================================================
-- RLS — isolamento por account_id (a barreira de segurança)
-- =============================================================================

-- account_id ativo da sessão, lido do JWT (o backend injeta nos claims).
create or replace function public.current_account_id()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'account_id','')::uuid
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'is_super_admin')::boolean,false)
$$;

-- Policy padrão por tabela com account_id: vê/escreve se for da conta (ou super_admin).
do $$
declare t text;
begin
  foreach t in array array[
    'core_empreendimentos','core_usuarios',
    'track_eventos',
    'crm_funil_etapas','crm_leads','crm_notas','crm_tarefas','crm_atividades'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using ( account_id = public.current_account_id() or public.is_super_admin() )
        with check ( account_id = public.current_account_id() or public.is_super_admin() );
    $f$, t, t);
  end loop;
end $$;

-- core_contas: enxerga só a própria conta (ou tudo se super_admin)
alter table public.core_contas enable row level security;
drop policy if exists conta_self on public.core_contas;
create policy conta_self on public.core_contas
  using ( id = public.current_account_id() or public.is_super_admin() )
  with check ( id = public.current_account_id() or public.is_super_admin() );

-- =============================================================================
-- SEED — primeiro tenant (REMAX) + empreendimento now-residence
-- IDs fixos pra carimbar no tracking.config.js da LP. Idempotente.
-- =============================================================================
insert into public.core_contas (id, slug, name, brand_name, custom_domain)
values ('a0000000-0000-4000-8000-000000000001','remax','REMAX (Rodrigo & Acram)','REMAX','crm.remaxsc.com.br')
on conflict (id) do nothing;

insert into public.core_empreendimentos (id, account_id, slug, name, construtora)
values ('e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','now-residence','NOW Residence','Gober')
on conflict (id) do nothing;

-- funil padrão (topo/meio/fundo) para a conta REMAX
insert into public.crm_funil_etapas (account_id, name, phase, position) values
  ('a0000000-0000-4000-8000-000000000001','Novo lead','topo',0),
  ('a0000000-0000-4000-8000-000000000001','Em contato','meio',1),
  ('a0000000-0000-4000-8000-000000000001','Visita/Reunião','fundo',2),
  ('a0000000-0000-4000-8000-000000000001','Proposta','fundo',3)
on conflict (account_id, position) do nothing;

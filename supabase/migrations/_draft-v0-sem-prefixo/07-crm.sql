-- =============================================================================
-- 07 — CRM: funnel_stages, lead_notes, lead_activities, lead_tasks
-- DRAFT v0. Revisar antes de produção.
-- ⚠️ Ordem: funnel_stages é referenciado por leads.stage_id (06). Em deploy
--    limpo, aplicar 07 antes de criar a FK, ou criar a FK ao final.
-- =============================================================================

-- Etapas do funil — configurável por conta. phase = topo|meio|fundo (Acram)
create table if not exists public.funnel_stages (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  name        text not null,
  phase       text not null default 'topo',   -- topo | meio | fundo
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  constraint ux_stage_account_position unique (account_id, position)
);
create index if not exists ix_stages_account on public.funnel_stages (account_id, position);

-- Anotações livres do corretor
create table if not exists public.lead_notes (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  author_id   uuid references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists ix_notes_lead on public.lead_notes (lead_id, created_at desc);

-- Histórico de atividades (mudou etapa, contato feito, dossiê gerado...)
create table if not exists public.lead_activities (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  actor_id    uuid references auth.users(id),
  type        text not null,                 -- stage_change | contact | dossie | system...
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists ix_activities_lead on public.lead_activities (lead_id, created_at desc);

-- Tarefas / follow-up agendado (suporta a regra dos 5–12 contatos)
create table if not exists public.lead_tasks (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  assignee_id uuid references auth.users(id),
  title       text not null,
  due_at      timestamptz,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists ix_tasks_assignee_due on public.lead_tasks (assignee_id, due_at) where done = false;

-- Seed sugerido de etapas (rodar por conta no onboarding):
-- topo:  Novo, Contato iniciado
-- meio:  Em follow-up, Qualificado
-- fundo: Reunião agendada, Proposta, Fechamento

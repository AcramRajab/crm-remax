-- =============================================================================
-- 2026-06-26_02 — Omnichannel (crm_conversas / crm_mensagens) + crm_dossie
-- Aplicar DEPOIS de 2026-06-26_01 (depende de core_contas / crm_leads).
-- Camada de canal AGNÓSTICA: WhatsApp (Evolution) e e-mail entram igual.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname='msg_channel') then
    create type msg_channel as enum ('whatsapp','email');
  end if;
  if not exists (select 1 from pg_type where typname='msg_direction') then
    create type msg_direction as enum ('inbound','outbound');
  end if;
end $$;

-- crm_conversas — uma conversa por (lead, canal)
create table if not exists public.crm_conversas (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.core_contas(id) on delete cascade,
  lead_id         uuid not null references public.crm_leads(id) on delete cascade,
  channel         msg_channel not null,
  external_ref    text,                  -- instância Evolution / thread de e-mail
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  constraint ux_conversa_lead_channel unique (lead_id, channel)
);
create index if not exists ix_conversas_lead on public.crm_conversas (lead_id);

-- crm_mensagens — mensagens dentro de uma conversa
create table if not exists public.crm_mensagens (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  conversation_id uuid not null references public.crm_conversas(id) on delete cascade,
  direction     msg_direction not null,  -- inbound | outbound
  body          text,
  attachments   jsonb not null default '[]'::jsonb,
  external_id   text,                    -- id da mensagem no provedor (dedup)
  sent_at       timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists ix_mensagens_conversa on public.crm_mensagens (conversation_id, sent_at);

-- crm_dossie — dossiê IA cacheado por lead (1 por lead; regenerar = update)
create table if not exists public.crm_dossie (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  lead_id       uuid not null references public.crm_leads(id) on delete cascade,
  content       text not null,
  model         text,                    -- modelo via OpenRouter
  sources       jsonb not null default '{}'::jsonb,
  is_public_estimate boolean not null default true,  -- LGPD
  generated_at  timestamptz not null default now(),
  constraint ux_dossie_lead unique (lead_id)
);
create index if not exists ix_dossie_lead on public.crm_dossie (lead_id);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['crm_conversas','crm_mensagens','crm_dossie'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using ( account_id = public.current_account_id() or public.is_super_admin() )
        with check ( account_id = public.current_account_id() or public.is_super_admin() );
    $f$, t, t);
  end loop;
end $$;

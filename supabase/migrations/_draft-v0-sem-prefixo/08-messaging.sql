-- =============================================================================
-- 08 — Mensageria omnichannel: conversations + messages
-- DRAFT v0. Revisar antes de produção.
-- Camada AGNÓSTICA de canal (ADR 0003). WhatsApp via Evolution; e-mail via provedor.
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'msg_channel') then
    create type msg_channel as enum ('whatsapp', 'email');
  end if;
  if not exists (select 1 from pg_type where typname = 'msg_direction') then
    create type msg_direction as enum ('inbound', 'outbound');
  end if;
end $$;

-- Uma conversa por (lead, canal)
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,
  channel       msg_channel not null,
  external_ref  text,                  -- ex.: instância Evolution / thread de e-mail
  last_message_at timestamptz,
  created_at    timestamptz not null default now(),
  constraint ux_conversation_lead_channel unique (lead_id, channel)
);
create index if not exists ix_conversations_lead on public.conversations (lead_id);

-- Cada mensagem in/out
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction       msg_direction not null,
  channel         msg_channel not null,
  body            text,
  media           jsonb,                 -- anexos
  status          text,                  -- sent | delivered | read | failed
  external_id     text,                  -- id no provedor (dedup)
  sender_id       uuid references auth.users(id),  -- corretor, se outbound manual
  created_at      timestamptz not null default now()
);
create index if not exists ix_messages_conversation on public.messages (conversation_id, created_at);
create unique index if not exists ux_messages_external on public.messages (channel, external_id) where external_id is not null;

comment on table public.conversations is 'Hub omnichannel no lead. Provedor abstrato: trocar Evolution→oficial não toca a UI.';

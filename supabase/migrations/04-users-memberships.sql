-- =============================================================================
-- 04 — memberships e papéis
-- DRAFT v0. Revisar antes de produção.
-- Usuários vêm do Supabase Auth (auth.users). Aqui ligamos usuário ↔ conta.
-- =============================================================================

-- Papéis: super_admin (nós) | account_admin (dono) | broker (corretor)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('super_admin', 'account_admin', 'broker');
  end if;
end $$;

create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  account_id  uuid not null references public.accounts(id) on delete cascade,
  role        app_role not null default 'broker',
  created_at  timestamptz not null default now(),

  constraint ux_membership_user_account unique (user_id, account_id)
);

create index if not exists ix_memberships_account on public.memberships (account_id);
create index if not exists ix_memberships_user on public.memberships (user_id);

-- Um usuário pode pertencer a mais de uma conta (útil para nós, super_admin).
-- O account_id "ativo" da sessão vai num JWT claim (ver 10-rls.sql).

comment on table public.memberships is 'Liga auth.users a accounts com um papel. super_admin enxerga todas as contas (ver RLS).';

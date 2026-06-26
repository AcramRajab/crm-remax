-- =============================================================================
-- 10 — RLS multi-tenant (ADR 0001)
-- DRAFT v0. Revisar com cuidado antes de produção — isolamento é segurança.
-- Isola por account_id, lido de um JWT claim da sessão.
-- =============================================================================

-- Helper: account_id ativo da sessão (do JWT). Ajustar conforme como o claim é setado.
-- Sugestão: o backend (Workers) injeta "account_id" e "is_super_admin" nos claims do JWT.
create or replace function public.current_account_id()
returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'account_id', '')::uuid
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'is_super_admin')::boolean, false)
$$;

-- ---------------------------------------------------------------------------
-- Ativar RLS e aplicar policy padrão por tabela de domínio.
-- Padrão: vê linha se account_id = conta da sessão OU se for super_admin.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'empreendimentos','tracking_events','leads','funnel_stages',
    'lead_notes','lead_activities','lead_tasks',
    'conversations','messages','dossie','account_marketing_credentials'
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

-- accounts: vê a própria conta (ou tudo se super_admin)
alter table public.accounts enable row level security;
drop policy if exists account_self on public.accounts;
create policy account_self on public.accounts
  using ( id = public.current_account_id() or public.is_super_admin() )
  with check ( id = public.current_account_id() or public.is_super_admin() );

-- ---------------------------------------------------------------------------
-- Visibilidade do CORRETOR (broker): vê só os próprios leads.
-- account_admin/super_admin veem todos da conta. Configurável p/ "visão de equipe".
-- Esta policy soma à de tenant: aplicar como policy restritiva adicional.
-- ---------------------------------------------------------------------------
-- NOTA: refinar conforme o papel é exposto no JWT. Esqueleto:
-- create policy broker_owns_leads on public.leads as restrictive
--   using (
--     public.is_super_admin()
--     or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'account_admin'
--     or owner_id = auth.uid()
--   );

-- ⚠️ Testar cada policy com um usuário de cada papel antes de produção.

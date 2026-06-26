-- =============================================================================
-- 2026-06-26_04 — Equipe & convites (multi-tenant de verdade)
-- Aplicar DEPOIS de _03.
--
-- O QUE MUDA E POR QUÊ:
--   _03 tinha um bootstrap temporário: TODO signup novo virava account_admin da
--   conta REMAX. Isso quebra multi-tenant — um corretor convidado por outra
--   imobiliária cairia na REMAX como admin. Aqui trocamos por um trigger
--   dirigido por convite: a associação conta<->usuário só nasce quando o convite
--   carimba account_id + role no metadata do usuário (feito pelo worker
--   /api/team/invite, com service_role). Signup avulso (sem convite) NÃO entra
--   em nenhuma conta.
-- =============================================================================

-- 1) e-mail desnormalizado em core_usuarios (a UI lê daqui; o browser não
--    enxerga auth.users). Backfill dos usuários que já existem.
alter table public.core_usuarios add column if not exists email text;

update public.core_usuarios u
set email = au.email
from auth.users au
where au.id = u.user_id and (u.email is null or u.email = '');

-- 2) trigger de novo usuário: dirigido por convite (metadata), não mais REMAX fixo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_account_id uuid := nullif(new.raw_user_meta_data->>'account_id','')::uuid;
  v_role app_role;
begin
  -- Sem account_id no convite => não associa a conta nenhuma (multi-tenant real).
  if v_account_id is null then
    return new;
  end if;

  begin
    v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'broker')::app_role;
  exception when others then
    v_role := 'broker';
  end;

  insert into public.core_usuarios (user_id, account_id, role, name, email)
  values (
    new.id,
    v_account_id,
    v_role,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (user_id, account_id) do nothing;

  return new;
end;
$$;

-- trigger já existe do _03 (on_auth_user_created); recriar é idempotente.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

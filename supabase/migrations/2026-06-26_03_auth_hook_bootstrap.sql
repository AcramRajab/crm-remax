-- =============================================================================
-- 2026-06-26_03 — Auth: hook de JWT (account_id no token) + bootstrap do 1º usuário
-- Aplicar DEPOIS de _01. Depois, ATIVAR o hook no painel:
--   Authentication → Hooks → "Customize Access Token (JWT) Claims"
--   → escolher: public.custom_access_token_hook
-- E (pra signup entrar direto sem e-mail): Authentication → Providers → Email
--   → desligar "Confirm email" (por enquanto).
-- =============================================================================

-- Hook: injeta account_id + papel nos claims do JWT. A RLS lê isso
-- (current_account_id() / is_super_admin()).
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  v_account_id uuid;
  v_role text;
  claims jsonb;
begin
  select account_id, role::text into v_account_id, v_role
  from public.core_usuarios
  where user_id = (event->>'user_id')::uuid
  order by created_at asc
  limit 1;

  claims := coalesce(event->'claims', '{}'::jsonb);
  if v_account_id is not null then
    claims := jsonb_set(claims, '{account_id}', to_jsonb(v_account_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{is_super_admin}', to_jsonb(v_role = 'super_admin'));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- O serviço de auth precisa executar o hook e ler core_usuarios.
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.core_usuarios to supabase_auth_admin;

drop policy if exists auth_admin_read_usuarios on public.core_usuarios;
create policy auth_admin_read_usuarios on public.core_usuarios
  for select to supabase_auth_admin using (true);

-- BOOTSTRAP (temporário — primeiro tenant): todo signup novo vira account_admin
-- da conta REMAX. Em produção isso vira CONVITE por conta. Por ora, simples.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.core_usuarios (user_id, account_id, role, name)
  values (
    new.id,
    'a0000000-0000-4000-8000-000000000001',   -- conta REMAX (seed do _01)
    'account_admin',
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id, account_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

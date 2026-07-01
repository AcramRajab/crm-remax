-- =============================================================================
-- 2026-06-30_05 — Código de divulgação por corretor (atribuição de lead)
-- Aplicar DEPOIS de _04.
--
-- O QUE MUDA E POR QUÊ:
--   Vários corretores vão disparar a MESMA LP (e-mail mkt + WhatsApp + redes)
--   para a campanha do Boat Show. Cada corretor precisa de um LINK PRÓPRIO
--   (.../now-residence?c=<ref_code>) para que o lead que entrar por ele caia
--   ATRIBUÍDO a ele no CRM (crm_leads.owner_id).
--
--   ref_code é único POR CONTA (multi-tenant: duas imobiliárias podem ter um
--   corretor "joao" cada uma). Gerado a partir do nome/e-mail, legível no link.
--   Se o lead vier sem ?c= (ou com código inexistente), owner_id fica nulo e a
--   distribuição normal (round-robin/n8n) assume — nada quebra.
-- =============================================================================

-- 1) Coluna do código de divulgação.
alter table public.core_usuarios add column if not exists ref_code text;

-- 2) slugify: nome -> slug ascii limpo (trata acentos PT-BR).
create or replace function public.slugify(p text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- 3) gen_ref_code: gera um ref_code livre dentro da conta (sufixo -2, -3… em colisão).
create or replace function public.gen_ref_code(p_account uuid, p_base text)
returns text language plpgsql as $$
declare
  base text := nullif(public.slugify(p_base), '');
  cand text;
  n int := 1;
begin
  if base is null then base := 'corretor'; end if;
  cand := base;
  while exists (
    select 1 from public.core_usuarios where account_id = p_account and ref_code = cand
  ) loop
    n := n + 1;
    cand := base || '-' || n;
  end loop;
  return cand;
end;
$$;

-- 4) Backfill dos membros que já existem (um a um, garantindo unicidade).
do $$
declare r record;
begin
  for r in
    select id, account_id,
           coalesce(nullif(name, ''), split_part(coalesce(email, ''), '@', 1)) as base
    from public.core_usuarios
    where ref_code is null or ref_code = ''
  loop
    update public.core_usuarios
      set ref_code = public.gen_ref_code(r.account_id, r.base)
      where id = r.id;
  end loop;
end $$;

-- 5) Único por conta.
create unique index if not exists ux_usuarios_account_refcode
  on public.core_usuarios (account_id, ref_code);

-- 6) Novo usuário (convite) já nasce com ref_code.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_account_id uuid := nullif(new.raw_user_meta_data->>'account_id', '')::uuid;
  v_role app_role;
  v_name text;
begin
  -- Sem account_id no convite => não associa a conta nenhuma (multi-tenant real).
  if v_account_id is null then
    return new;
  end if;

  begin
    v_role := coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'broker')::app_role;
  exception when others then
    v_role := 'broker';
  end;

  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.core_usuarios (user_id, account_id, role, name, email, ref_code)
  values (
    new.id,
    v_account_id,
    v_role,
    v_name,
    new.email,
    public.gen_ref_code(v_account_id, v_name)
  )
  on conflict (user_id, account_id) do nothing;

  return new;
end;
$$;

-- trigger já existe do _03/_04; recriar é idempotente.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

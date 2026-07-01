-- =============================================================================
-- 2026-06-30_06 — Indicadores (corretores externos self-service)
-- Aplicar DEPOIS de _05.
--
-- O QUE É E POR QUÊ:
--   Página pública /now-residence/corretores: corretor de QUALQUER imobiliária
--   preenche nome + telefone + imobiliária e recebe um LINK DE INDICAÇÃO
--   (.../now-residence?c=<ref_code>) pra divulgar a LP oficial. Todo lead que
--   entrar por esse link fica registrado como indicação dele (no journey).
--
--   Diferente de core_usuarios (equipe interna, que vira owner_id do lead):
--   indicador é um PARCEIRO EXTERNO. O lead dele NÃO vira owner_id (ele não
--   trabalha no nosso CRM) — a atribuição fica no journey pra comissão/relatório,
--   e o lead segue a distribuição normal do time interno.
--
--   ref_code é único considerando core_usuarios + crm_indicadores (mesmo espaço
--   de link), pra o Worker resolver sem ambiguidade.
-- =============================================================================

create table if not exists public.crm_indicadores (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.core_contas(id) on delete cascade,
  empreendimento_id uuid references public.core_empreendimentos(id),
  nome              text not null,
  telefone          text,
  imobiliaria       text,
  ref_code          text not null,
  created_at        timestamptz not null default now(),
  constraint ux_indicador_account_refcode unique (account_id, ref_code)
);
create index if not exists ix_indicadores_account on public.crm_indicadores (account_id);

-- RLS: barreira ligada. O cadastro/consulta passa SEMPRE pelo Worker com
-- service_role (que bypassa RLS) — o browser nunca fala direto com esta tabela.
-- Sem policy pra anon/auth = ninguém além do service_role acessa (default deny).
alter table public.crm_indicadores enable row level security;

-- Gera um ref_code livre (único em core_usuarios + crm_indicadores) e insere o
-- indicador. Retorna o ref_code. Chamado pelo Worker via RPC (service_role).
create or replace function public.criar_indicador(
  p_account uuid, p_emp uuid, p_nome text, p_telefone text, p_imobiliaria text
) returns text language plpgsql security definer set search_path = public as $$
declare
  base text := left(coalesce(nullif(public.slugify(p_nome), ''), 'corretor'), 32);
  cand text := base;
  n int := 1;
begin
  while exists (select 1 from public.crm_indicadores where account_id = p_account and ref_code = cand)
     or exists (select 1 from public.core_usuarios  where account_id = p_account and ref_code = cand) loop
    n := n + 1;
    cand := base || '-' || n;
  end loop;

  insert into public.crm_indicadores (account_id, empreendimento_id, nome, telefone, imobiliaria, ref_code)
  values (p_account, p_emp, p_nome, p_telefone, p_imobiliaria, cand);

  return cand;
end;
$$;

-- =============================================================================
-- 2026-07-01_09 — Campos personalizados + Produtos do lead (estilo Pipedrive)
-- Aplicar DEPOIS de _08.
-- =============================================================================

-- Definição de campos personalizados por conta (Detalhes do lead).
create table if not exists public.crm_campos (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  nome        text not null,
  tipo        text not null default 'text',   -- text | number | date | select
  opcoes      jsonb not null default '[]'::jsonb,  -- para tipo select
  posicao     int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists ix_campos_account on public.crm_campos (account_id, posicao);

-- Valores dos campos personalizados por lead (jsonb: { campo_id: valor }).
alter table public.crm_leads add column if not exists campos jsonb not null default '{}'::jsonb;

-- Produtos/itens do lead (somam no valor do negócio).
create table if not exists public.crm_lead_produtos (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.core_contas(id) on delete cascade,
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  nome        text not null,
  quantidade  numeric not null default 1,
  valor_unit  numeric(14,2) not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists ix_lead_produtos on public.crm_lead_produtos (lead_id);

-- RLS (mesmo padrão do _01).
do $$ declare t text; begin
  foreach t in array array['crm_campos','crm_lead_produtos'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using ( account_id = public.current_account_id() or public.is_super_admin() )
        with check ( account_id = public.current_account_id() or public.is_super_admin() );
    $f$, t, t);
  end loop;
end $$;

-- Seed: alguns campos personalizados de exemplo para a conta REMAX.
do $$ declare v_acc uuid := 'a0000000-0000-4000-8000-000000000001'; begin
  if exists (select 1 from public.core_contas where id = v_acc)
     and not exists (select 1 from public.crm_campos where account_id = v_acc) then
    insert into public.crm_campos (account_id, nome, tipo, opcoes, posicao) values
      (v_acc, 'Necessidade', 'text', '[]'::jsonb, 0),
      (v_acc, 'Como conheceu', 'select', '["Indicação","Anúncio","Redes sociais","Passou em frente","Corretor"]'::jsonb, 1),
      (v_acc, 'Prazo de compra', 'select', '["Imediato","3 meses","6 meses","Mais de 6 meses"]'::jsonb, 2),
      (v_acc, 'Renda aproximada', 'number', '[]'::jsonb, 3);
  end if;
end $$;

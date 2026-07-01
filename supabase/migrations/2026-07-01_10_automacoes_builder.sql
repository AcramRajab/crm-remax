-- =============================================================================
-- 2026-07-01_10 — Automações: builder Gatilho -> Ações (estilo ActiveCampaign)
-- Aplicar DEPOIS de _09.
--
-- Substitui a automação simples (só e-mail) por um construtor: cada automação
-- tem UM gatilho e uma LISTA de ações executadas em ordem (incluindo "aguardar").
-- Executa no cron do Worker. Gatilhos/ações que dependem de infra externa
-- (email aberto, link clicado, segmentos) ficam no builder mas não disparam até
-- a infra existir — nada fake.
-- =============================================================================

-- Tags reais no lead (antes eram só no app).
alter table public.crm_leads add column if not exists tags text[] not null default '{}';

-- Automação (gatilho + config do gatilho).
create table if not exists public.crm_automacoes (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.core_contas(id) on delete cascade,
  nome           text not null,
  gatilho        text not null default 'lead_criado',
  -- lead_criado | tag_adicionada | tag_removida | score_limite | email_aberto
  -- | link_clicado | status_alterado | evento_customizado | agendado
  gatilho_config jsonb not null default '{}'::jsonb,   -- ex.: {tag}, {limite}, {status}
  ativo          boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists ix_automacoes_account on public.crm_automacoes (account_id, gatilho, ativo);

-- Ações da automação, na ordem de execução.
create table if not exists public.crm_automacao_acoes (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  automacao_id  uuid not null references public.crm_automacoes(id) on delete cascade,
  posicao       int not null default 0,
  tipo          text not null,
  -- enviar_email | adicionar_tag | remover_tag | atualizar_campo | webhook
  -- | notificar | add_segmento | remove_segmento | alterar_score | aguardar
  config        jsonb not null default '{}'::jsonb,   -- ex.: {assunto,corpo},{tag},{horas}...
  created_at    timestamptz not null default now(),
  constraint ux_acao_pos unique (automacao_id, posicao)
);
create index if not exists ix_acoes_automacao on public.crm_automacao_acoes (automacao_id, posicao);

-- Execução: um lead percorrendo as ações de uma automação (fila do cron).
create table if not exists public.crm_automacao_execucoes (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  automacao_id  uuid not null references public.crm_automacoes(id) on delete cascade,
  lead_id       uuid not null references public.crm_leads(id) on delete cascade,
  status        text not null default 'ativa',   -- ativa | concluida | cancelada
  acao_idx      int not null default 0,
  proximo_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ix_exec_fila on public.crm_automacao_execucoes (status, proximo_at);

-- RLS (mesmo padrão do _01).
do $$ declare t text; begin
  foreach t in array array['crm_automacoes','crm_automacao_acoes','crm_automacao_execucoes'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using ( account_id = public.current_account_id() or public.is_super_admin() )
        with check ( account_id = public.current_account_id() or public.is_super_admin() );
    $f$, t, t);
  end loop;
end $$;

-- Gatilho: inscreve o lead nas automações ativas quando o evento acontece.
create or replace function public.enroll_automacoes()
returns trigger language plpgsql security definer set search_path = public as $$
declare a record; matched boolean; lim int;
begin
  for a in
    select id, gatilho, gatilho_config from public.crm_automacoes
    where account_id = NEW.account_id and ativo = true
  loop
    matched := false;

    if TG_OP = 'INSERT' and a.gatilho = 'lead_criado' then
      matched := true;

    elsif TG_OP = 'UPDATE' then
      if a.gatilho = 'status_alterado' and NEW.status is distinct from OLD.status then
        matched := (coalesce(a.gatilho_config->>'status','') = '' or a.gatilho_config->>'status' = NEW.status::text);

      elsif a.gatilho = 'tag_adicionada'
            and exists (select 1 from unnest(NEW.tags) t where not (t = any(OLD.tags))) then
        matched := (coalesce(a.gatilho_config->>'tag','') = '' or (a.gatilho_config->>'tag') = any(NEW.tags));

      elsif a.gatilho = 'tag_removida'
            and exists (select 1 from unnest(OLD.tags) t where not (t = any(NEW.tags))) then
        matched := true;

      elsif a.gatilho = 'score_limite' and NEW.score is distinct from OLD.score then
        lim := coalesce((a.gatilho_config->>'limite')::int, 0);
        matched := (NEW.score >= lim and coalesce(OLD.score,0) < lim);
      end if;
    end if;

    if matched then
      insert into public.crm_automacao_execucoes (account_id, automacao_id, lead_id, status, acao_idx, proximo_at)
      values (NEW.account_id, a.id, NEW.id, 'ativa', 0, now());
    end if;
  end loop;
  return NEW;
end $$;

drop trigger if exists trg_automacoes_ins on public.crm_leads;
create trigger trg_automacoes_ins after insert on public.crm_leads
  for each row execute function public.enroll_automacoes();

drop trigger if exists trg_automacoes_upd on public.crm_leads;
create trigger trg_automacoes_upd after update on public.crm_leads
  for each row execute function public.enroll_automacoes();

-- =============================================================================
-- 2026-07-01_08 — Automações de e-mail (sequências / nutrição)
-- Aplicar DEPOIS de _07.
--
-- Motor: Cloudflare (cron no Worker) + Resend. Este SQL guarda as sequências,
-- os passos (e-mails), as inscrições (lead dentro de uma sequência) e o log de
-- envios. Gatilhos automáticos inscrevem o lead quando ele ENTRA ou é DESCARTADO.
--
-- Envio real só acontece quando: a conta tiver email_remetente + email_ativo,
-- e o Worker tiver o secret RESEND_API_KEY. Sem isso, o cron não envia (o lead
-- fica na fila até configurar). Nada fake.
-- =============================================================================

-- Config de e-mail por conta (o remetente é DO CLIENTE; a chave Resend é da
-- plataforma, fica em secret do Worker — não aqui).
alter table public.core_contas add column if not exists email_remetente text;
alter table public.core_contas add column if not exists email_remetente_nome text;
alter table public.core_contas add column if not exists email_ativo boolean not null default false;

-- Sequência: um fluxo disparado por um gatilho.
create table if not exists public.crm_sequencias (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.core_contas(id) on delete cascade,
  empreendimento_id uuid references public.core_empreendimentos(id),  -- null = todos
  nome              text not null,
  gatilho           text not null default 'lead_entrou',  -- lead_entrou | lead_descartado | manual
  ativo             boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists ix_seq_account on public.crm_sequencias (account_id, gatilho, ativo);

-- Passo: um e-mail da sequência, com atraso (horas após o passo anterior).
create table if not exists public.crm_sequencia_passos (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  sequencia_id  uuid not null references public.crm_sequencias(id) on delete cascade,
  posicao       int not null default 0,
  delay_horas   int not null default 0,   -- horas após o passo anterior (0 = imediato)
  assunto       text not null,
  corpo         text not null,            -- suporta {{nome}} / {{primeiro_nome}}
  created_at    timestamptz not null default now(),
  constraint ux_passo_seq_pos unique (sequencia_id, posicao)
);
create index if not exists ix_passo_seq on public.crm_sequencia_passos (sequencia_id, posicao);

-- Inscrição: um lead dentro de uma sequência (a fila do cron).
create table if not exists public.crm_sequencia_inscricoes (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.core_contas(id) on delete cascade,
  sequencia_id     uuid not null references public.crm_sequencias(id) on delete cascade,
  lead_id          uuid not null references public.crm_leads(id) on delete cascade,
  status           text not null default 'ativa',  -- ativa | concluida | cancelada
  passo_idx        int not null default 0,          -- próxima posição a enviar
  proximo_envio_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ux_inscricao_seq_lead unique (sequencia_id, lead_id)
);
create index if not exists ix_inscr_fila on public.crm_sequencia_inscricoes (status, proximo_envio_at);

-- Log de envios (histórico + idempotência + "ver os e-mails").
create table if not exists public.crm_sequencia_envios (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.core_contas(id) on delete cascade,
  inscricao_id  uuid references public.crm_sequencia_inscricoes(id) on delete cascade,
  sequencia_id  uuid references public.crm_sequencias(id) on delete set null,
  passo_id      uuid references public.crm_sequencia_passos(id) on delete set null,
  lead_id       uuid references public.crm_leads(id) on delete cascade,
  assunto       text,
  status        text not null default 'enviado',  -- enviado | falhou
  provider_id   text,
  erro          text,
  created_at    timestamptz not null default now()
);
create index if not exists ix_envios_lead on public.crm_sequencia_envios (lead_id, created_at);

-- ---------- RLS (isolamento por conta, mesmo padrão do _01) ----------
do $$ declare t text; begin
  foreach t in array array[
    'crm_sequencias','crm_sequencia_passos','crm_sequencia_inscricoes','crm_sequencia_envios'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists tenant_isolation on public.%I;
      create policy tenant_isolation on public.%I
        using ( account_id = public.current_account_id() or public.is_super_admin() )
        with check ( account_id = public.current_account_id() or public.is_super_admin() );
    $f$, t, t);
  end loop;
end $$;

-- ---------- Gatilhos: inscreve o lead automaticamente ----------
create or replace function public.enroll_sequences_on_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_gatilho text;
  s record;
  v_delay int;
begin
  if TG_OP = 'INSERT' then
    v_gatilho := 'lead_entrou';
  elsif TG_OP = 'UPDATE' and NEW.status = 'discarded' and coalesce(OLD.status,'') <> 'discarded' then
    v_gatilho := 'lead_descartado';
  else
    return NEW;
  end if;

  for s in
    select id from public.crm_sequencias
    where account_id = NEW.account_id and ativo = true and gatilho = v_gatilho
      and (empreendimento_id is null or empreendimento_id = NEW.empreendimento_id)
  loop
    select coalesce(delay_horas, 0) into v_delay
      from public.crm_sequencia_passos where sequencia_id = s.id and posicao = 0 limit 1;
    if v_delay is null then continue; end if;  -- sequência sem passos: ignora

    insert into public.crm_sequencia_inscricoes
      (account_id, sequencia_id, lead_id, status, passo_idx, proximo_envio_at)
    values
      (NEW.account_id, s.id, NEW.id, 'ativa', 0, now() + (v_delay || ' hours')::interval)
    on conflict (sequencia_id, lead_id) do nothing;
  end loop;

  return NEW;
end $$;

drop trigger if exists trg_enroll_lead_insert on public.crm_leads;
create trigger trg_enroll_lead_insert
  after insert on public.crm_leads
  for each row execute function public.enroll_sequences_on_lead();

drop trigger if exists trg_enroll_lead_discard on public.crm_leads;
create trigger trg_enroll_lead_discard
  after update of status on public.crm_leads
  for each row execute function public.enroll_sequences_on_lead();

-- ---------- Seed: sequências de exemplo (INATIVAS) para a conta REMAX ----------
-- Ficam inativas: o time revisa/edita no CRM e ativa quando quiser.
do $$
declare v_acc uuid := 'a0000000-0000-4000-8000-000000000001'; v_seq uuid;
begin
  if exists (select 1 from public.core_contas where id = v_acc) then
    -- Boas-vindas (lead novo)
    if not exists (select 1 from public.crm_sequencias where account_id=v_acc and nome='Boas-vindas (lead novo)') then
      insert into public.crm_sequencias (account_id, nome, gatilho, ativo)
      values (v_acc,'Boas-vindas (lead novo)','lead_entrou', false) returning id into v_seq;
      insert into public.crm_sequencia_passos (account_id, sequencia_id, posicao, delay_horas, assunto, corpo) values
        (v_acc, v_seq, 0, 0,  'Recebemos seu contato, {{primeiro_nome}}!',
         'Olá {{primeiro_nome}},\n\nObrigado pelo interesse no NOW Residence. Em breve um corretor fala com você. Enquanto isso, responda este e-mail com suas dúvidas.\n\nRE/MAX'),
        (v_acc, v_seq, 1, 48, 'Condições exclusivas do NOW Residence',
         'Oi {{primeiro_nome}},\n\nPreparamos condições especiais para quem quer morar ou investir no Centro de Itajaí. Quer que eu te mande a tabela e as plantas?\n\nRE/MAX'),
        (v_acc, v_seq, 2, 120,'Vamos agendar uma visita?',
         'Olá {{primeiro_nome}},\n\nQue tal conhecer o NOW pessoalmente ou por um tour virtual? Me diga o melhor horário.\n\nRE/MAX');
    end if;

    -- Nutrição (lead descartado)
    if not exists (select 1 from public.crm_sequencias where account_id=v_acc and nome='Nutrição leve (lead descartado)') then
      insert into public.crm_sequencias (account_id, nome, gatilho, ativo)
      values (v_acc,'Nutrição leve (lead descartado)','lead_descartado', false) returning id into v_seq;
      insert into public.crm_sequencia_passos (account_id, sequencia_id, posicao, delay_horas, assunto, corpo) values
        (v_acc, v_seq, 0, 168, 'Continuamos por aqui, {{primeiro_nome}}',
         'Oi {{primeiro_nome}},\n\nSe o momento não era agora, tudo bem. Vou te mandar novidades do NOW de vez em quando — sem spam. Qualquer coisa, é só responder.\n\nRE/MAX'),
        (v_acc, v_seq, 1, 720, 'Novidades do NOW Residence',
         'Olá {{primeiro_nome}},\n\nO NOW segue avançando. Se quiser rever as condições ou tirar dúvidas, estou à disposição.\n\nRE/MAX');
    end if;
  end if;
end $$;

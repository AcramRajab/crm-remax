-- =============================================================================
-- 2026-07-01_11 — FIX: trigger de nutrição quebrava toda mudança de status
-- Aplicar DEPOIS de _10.
--
-- BUG: em _08, enroll_sequences_on_lead usava `coalesce(OLD.status, '') <> 'discarded'`.
-- OLD.status é enum lead_status; o coalesce força converter '' para o enum ->
-- "invalid input value for enum lead_status: ''". Como o trigger roda em TODA
-- mudança de status (after update of status), qualquer UPDATE de status (ex.:
-- marcar Ganho) fazia ROLLBACK — o status não persistia e a automação não
-- disparava. Correção: `OLD.status is distinct from 'discarded'` (sem coerção).
-- =============================================================================

create or replace function public.enroll_sequences_on_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_gatilho text;
  s record;
  v_delay int;
begin
  if TG_OP = 'INSERT' then
    v_gatilho := 'lead_entrou';
  elsif TG_OP = 'UPDATE' and NEW.status = 'discarded' and OLD.status is distinct from 'discarded' then
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
    if v_delay is null then continue; end if;

    insert into public.crm_sequencia_inscricoes
      (account_id, sequencia_id, lead_id, status, passo_idx, proximo_envio_at)
    values
      (NEW.account_id, s.id, NEW.id, 'ativa', 0, now() + (v_delay || ' hours')::interval)
    on conflict (sequencia_id, lead_id) do nothing;
  end loop;

  return NEW;
end $$;

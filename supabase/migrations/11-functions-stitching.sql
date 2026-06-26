-- =============================================================================
-- 11 — Stitching: anônimo → lead (esqueleto)
-- DRAFT v0. A regra de identidade é DECISÃO ABERTA #2 — este é o default proposto.
-- Chamado pelo n8n no momento da conversão (evento "Lead").
-- =============================================================================

-- Default de identidade (ADR/decisão aberta #2):
--   1. casar por email_hash; senão phone_hash
--   2. mesmo identificador com outro visitor_id → mesclar, acumulando visitor_ids
--   3. merge/split manual disponível no CRM
--
-- Esta função recebe os dados já validados pelo n8n (account confirmada).

create or replace function public.stitch_lead(
  p_account_id        uuid,
  p_empreendimento_id uuid,
  p_visitor_id        text,
  p_email             text,
  p_phone             text,
  p_email_hash        text,
  p_phone_hash        text,
  p_first_name        text default null,
  p_last_name         text default null,
  p_journey           jsonb default null,
  p_attribution       jsonb default null   -- {ft_source, lt_source, origin, ...}
) returns uuid
language plpgsql
as $$
declare
  v_lead_id uuid;
begin
  -- 1. tenta achar lead existente por email_hash, depois phone_hash (dentro da conta)
  select id into v_lead_id
  from public.leads
  where account_id = p_account_id
    and (
      (p_email_hash is not null and email_hash = p_email_hash)
      or (p_phone_hash is not null and phone_hash = p_phone_hash)
    )
  order by created_at asc
  limit 1;

  if v_lead_id is null then
    -- 2. cria novo lead
    insert into public.leads (
      account_id, empreendimento_id, email, phone, email_hash, phone_hash,
      first_name, last_name, visitor_ids, journey,
      origin, ft_source, ft_medium, ft_campaign, lt_source, lt_medium, lt_campaign
    ) values (
      p_account_id, p_empreendimento_id, p_email, p_phone, p_email_hash, p_phone_hash,
      p_first_name, p_last_name,
      case when p_visitor_id is not null then array[p_visitor_id] else '{}' end,
      p_journey,
      p_attribution->>'origin',
      p_attribution->>'ft_source', p_attribution->>'ft_medium', p_attribution->>'ft_campaign',
      p_attribution->>'lt_source', p_attribution->>'lt_medium', p_attribution->>'lt_campaign'
    )
    returning id into v_lead_id;
  else
    -- 3. mescla: acumula visitor_id e completa campos vazios
    update public.leads
    set visitor_ids = (
          select array(select distinct unnest(visitor_ids || coalesce(array[p_visitor_id], '{}')))
        ),
        email      = coalesce(email, p_email),
        phone      = coalesce(phone, p_phone),
        first_name = coalesce(first_name, p_first_name),
        last_name  = coalesce(last_name, p_last_name),
        journey    = coalesce(p_journey, journey),
        updated_at = now()
    where id = v_lead_id;
  end if;

  -- TODO (no n8n após esta função):
  --   - registrar lead_activity 'system: lead criado/atualizado'
  --   - disparar geração de dossiê (OpenRouter + Apify/Firecrawl)
  --   - aplicar regra de distribuição (account.lead_distribution_rule) p/ setar owner_id

  return v_lead_id;
end $$;

comment on function public.stitch_lead is 'Costura anônimo→lead. Regra de identidade = decisão aberta #2 (default: email_hash→phone_hash + merge).';

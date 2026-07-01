-- =============================================================================
-- 2026-07-01_07 — Valor do lead (negócio) para análise no dashboard
-- Aplicar DEPOIS de _06.
--
-- Campo de valor do negócio (estilo Pipedrive). Fica no lead; o dashboard soma
-- por etapa/corretor/empreendimento depois. NULL = sem valor definido ainda.
-- =============================================================================

alter table public.crm_leads add column if not exists valor numeric(14,2);

comment on column public.crm_leads.valor is 'Valor do negócio (R$) para pipeline/forecast; NULL = não definido';

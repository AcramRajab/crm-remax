-- =============================================================================
-- 01 — Extensões
-- DRAFT v0. Revisar antes de produção.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid(), digest()
create extension if not exists "citext";      -- email case-insensitive (opcional)

-- Convenção: todas as tabelas de domínio têm:
--   account_id uuid not null references accounts(id)
-- e, quando ligadas a empreendimento:
--   empreendimento_id uuid references empreendimentos(id)

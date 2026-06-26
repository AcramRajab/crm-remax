# ADR 0001 — Multi-tenant pooled com RLS

**Status:** ✅ fechado

## Contexto
A plataforma será vendida em white-label para várias imobiliárias. Alternativas: replicar o projeto por cliente (single-tenant por instância) ou um único sistema multi-tenant.

O `tracking-kit` V1 já sofre com replicação (1 Supabase + 1 n8n por cliente) — atualizar N instâncias uma a uma é dolaroso. O roadmap dele já prevê V2 central.

## Decisão
**Multi-tenant pooled:** um Supabase, tabelas compartilhadas, isolamento por **RLS** no `account_id`. Não replicar banco por cliente.

## Consequências
- Atualiza uma vez, todos recebem.
- Toda tabela de domínio carrega `account_id`; RLS filtra automático.
- White-label por config de conta (domínio + identidade).
- **Saída de emergência:** cliente enterprise que exija silo físico → apontar o tenant para outro Supabase, possível só porque o código lê o tenant de config (nunca hardcoded). Modelo híbrido (pool + silo) fica disponível sem reescrita.
- Performance: índice composto em `account_id` mantém queries rápidas.

## Regra inquebrável
Nunca acessar dado sem passar pelo tenant. Toda query/evento/automação carrega o `account_id`.

# supabase/

Banco de dados da plataforma: schema, RLS multi-tenant, views e funções.
Projeto Supabase: `plbzwswqkeozvyirzqma`.

## Convenção de nomes (prefixo por domínio)

Pra escalar e bater o olho sabendo o que é cada tabela, o prefixo indica **a que parte do sistema** a tabela pertence:

| Prefixo | Domínio | Tabelas |
|---|---|---|
| `core_` | espinha dorsal multi-tenant | `core_contas`, `core_empreendimentos`, `core_usuarios` |
| `crm_`  | CRM de vendas | `crm_leads`, `crm_funil_etapas`, `crm_notas`, `crm_tarefas`, `crm_atividades`, `crm_conversas`, `crm_mensagens`, `crm_dossie` |
| `track_`| tracking / marketing | `track_eventos` |

Módulo novo no futuro = novo prefixo (ex.: cobrança → `bill_`), sem bagunçar o resto.

## Migrations ativas (aplicar nesta ordem)

| Arquivo | O que cria |
|---|---|
| `2026-06-26_01_fundacao_core_crm_track.sql` | enums, `core_*`, `track_eventos`, `crm_*` (leads/funil/notas/tarefas/atividades), RLS, **seed REMAX + now-residence** |
| `2026-06-26_02_mensageria_dossie.sql` | `crm_conversas`, `crm_mensagens`, `crm_dossie` + RLS |

> O rascunho antigo (sem prefixo) está arquivado em `migrations/_draft-v0-sem-prefixo/` só como referência de design — **não aplicar**.

## Conceitos-chave (ver `planning/03-modelo-de-dados.md`)

- **Toda** tabela de domínio tem `account_id`. Tabelas de empreendimento têm `empreendimento_id`.
- **RLS** isola por `account_id`, lido de um JWT claim da sessão (`current_account_id()` / `is_super_admin()`). É a barreira de segurança — nunca confiar em filtro de aplicação.
- **Slug único por conta:** `unique (account_id, slug)` em `core_empreendimentos`.
- `track_eventos` é **log append-only**; o CRM (`crm_leads` etc.) é **estado mutável**. O stitching faz a ponte.
- Seed usa **IDs fixos**: conta REMAX `a0000000-0000-4000-8000-000000000001`, empreendimento now-residence `e0000000-0000-4000-8000-000000000001` (carimbados no `tracking.config.js` da LP).

## Como aplicar

Cole cada arquivo de `migrations/` no **SQL Editor** do Supabase, na ordem (`_01` depois `_02`). Ou via Supabase CLI (`supabase db push`).

## Pendências que afetam o schema

- **Stitching** (anônimo→lead) ainda não portado pro novo padrão — próximo passo, junto da ingestão via n8n (ou insert direto do form, decisão a definir).
- **Regra de identidade do lead** (decisão aberta #2) afeta `crm_leads` e o stitching.
- Onde guardar **credenciais do cliente** com segurança (Vault / secrets do n8n) — ver `planning/09-onboarding-e-credenciais.md`.

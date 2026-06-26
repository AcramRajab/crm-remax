# supabase/

Banco de dados da plataforma: schema, RLS multi-tenant, views e funções.

> ⚠️ **Os SQLs em `migrations/` são um DRAFT inicial (v0)** para orientar o desenvolvimento. Revisar, testar e ajustar antes de aplicar em produção. São um ponto de partida coerente, não a versão final.

## Ordem das migrations

| Arquivo | O que cria |
|---|---|
| `01-extensions.sql` | Extensões (pgcrypto, etc.) |
| `02-accounts.sql` | `accounts` (tenant white-label) + credenciais do cliente |
| `03-empreendimentos.sql` | `empreendimentos` (vários por conta, slug único por conta) |
| `04-users-memberships.sql` | `users` view + `memberships` + papéis |
| `05-tracking-events.sql` | `tracking_events` (base do tracking-kit + account_id/empreendimento_id) |
| `06-leads.sql` | `leads` + identidade + atribuição consolidada |
| `07-crm.sql` | `funnel_stages`, `lead_notes`, `lead_activities`, `lead_tasks` |
| `08-messaging.sql` | `conversations` + `messages` (whatsapp/email) |
| `09-dossie.sql` | `dossie` |
| `10-rls.sql` | Políticas RLS por `account_id` + helper de claim |
| `11-functions-stitching.sql` | Função de stitching (anônimo→lead) — esqueleto |

## Conceitos-chave (ver `planning/03-modelo-de-dados.md`)

- **Toda** tabela de domínio tem `account_id`. Tabelas de empreendimento têm `empreendimento_id`.
- **RLS** isola por `account_id`, lido de um JWT claim da sessão.
- **Slug único por conta:** `unique (account_id, slug)` em `empreendimentos`.
- `tracking_events` é **log append-only**; o CRM (`leads` etc.) é **estado mutável**. O stitching faz a ponte.

## Como aplicar (dev)

```bash
# via Supabase CLI (recomendado)
supabase db reset           # aplica migrations em ordem (ambiente local)

# ou cole cada arquivo no SQL Editor do projeto, na ordem
```

## Pendências que afetam o schema

- **Regra de identidade do lead** (decisão aberta #2) afeta `leads` e a função de stitching.
- Onde guardar **credenciais do cliente** com segurança (Vault / secrets do n8n) — não deixar token em texto puro. Ver `planning/09-onboarding-e-credenciais.md`.

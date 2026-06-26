# n8n/

Workflows de automação (orquestrador server-side). **Versionar os JSONs exportados aqui** (sem credenciais — elas ficam nos secrets do n8n).

> 🚧 Placeholder. Exportar os workflows para esta pasta conforme forem criados.

## Por que o n8n é central

Tudo que é segredo (tokens, API keys) e tudo que precisa ser confiável passa pelo n8n. **Nunca** chamar IA/Apify/Firecrawl/pixels direto do browser.

## Workflows previstos

| Workflow | O que faz |
|---|---|
| `01-tracking-ingest` | Recebe evento da LP → valida/carimba `account_id` (anti-spoof) → idempotência (`event_id`) → grava em `tracking_events` → dispara pixels (Meta CAPI, GA4 MP, TikTok). |
| `02-stitching` | No evento `Lead`: chama `stitch_lead()` → cria/atualiza lead → registra atividade. |
| `03-dossie` | Após stitching: Firecrawl (páginas) + Apify (perfis/portais) → OpenRouter → grava `dossie`. |
| `04-distribuicao` | Aplica `account.lead_distribution_rule` → seta `owner_id` do lead (rodízio default). |
| `05-whatsapp-inbound` | Webhook Evolution → grava `messages` (inbound) → atualiza conversa. |
| `06-whatsapp-outbound` | CRM → Evolution → envia + grava `messages` (outbound). |
| `07-email` | Enviar (provedor) + inbound (webhook/parse) no thread do lead. |
| `08-nutricao-descarte` | Lead descartado → cadência de nutrição leve; sinal de vida → volta ao corretor. |

## Convenções

- Exportar workflow como JSON em `n8n/workflows/`.
- **Não** commitar credenciais (`.gitignore` já cobre). Usar credenciais do n8n por tenant.
- Cada workflow roteia por `account_id`/slug (multi-tenant, modelo V2 do tracking-kit).

## Infra

- n8n **self-hosted** (VPS / Railway / Render).
- **Evolution API** roda ao lado (Docker) para o WhatsApp.

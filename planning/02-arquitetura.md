# 02 — Arquitetura do Sistema

## Visão geral

```
                          PÚBLICO (lead navega)
   ┌──────────────────────────────────────────────────────────────┐
   │  LANDING PAGE (criada por nós, 1 por empreendimento)          │
   │  - tracking-kit embarcado                                     │
   │  - config carimba account_id + slug em CADA evento           │
   │  - form / clique WhatsApp = conversão                        │
   └───────────────────────────┬──────────────────────────────────┘
                               │ POST evento (event_id, account_id, slug, ...)
                               ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  n8n (self-hosted) — ORQUESTRADOR                             │
   │  1. valida/carimba a conta (não confia no browser)           │
   │  2. idempotência (event_id) + grava em tracking_events       │
   │  3. dispara pixels server-side (Meta CAPI, GA4 MP, TikTok)   │
   │  4. STITCHING: na conversão, junta visitor_id + identidade   │
   │     → materializa LEAD                                        │
   │  5. dispara DOSSIÊ (OpenRouter + Apify + Firecrawl)          │
   │  6. DISTRIBUIÇÃO: regra por conta atribui lead a corretor    │
   │  7. MENSAGERIA: webhook in/out WhatsApp (Evolution) + e-mail │
   └───────────────┬───────────────────────────┬──────────────────┘
                   │                           │
                   ▼                           ▼
   ┌────────────────────────────┐   ┌──────────────────────────────┐
   │  SUPABASE (Postgres)       │   │  PLATAFORMAS EXTERNAS         │
   │  - tracking_events (log)   │   │  Meta / Google Ads / GA4 /   │
   │  - accounts, empreend.     │   │  TikTok / Evolution / e-mail │
   │  - leads, notes, funnel    │   └──────────────────────────────┘
   │  - conversations, messages │
   │  - dossie                  │
   │  - RLS por account_id      │
   └───────────────┬────────────┘
                   │ (lê com RLS; tenant resolvido pelo domínio na entrada)
                   ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  APP (Cloudflare Pages + Workers)                            │
   │  - Dashboard de marketing (atribuição, origem, persona)      │
   │  - CRM: funil, lead + dossiê, hub omnichannel, anotações     │
   │  - aba Empreendimentos (vários por conta)                    │
   │  - white-label: domínio + identidade por conta               │
   └──────────────────────────────────────────────────────────────┘
```

## Camadas e responsabilidades

### 1. Landing Page (`landing-pages/`)
Criada por nós, uma por empreendimento. Embarca o `tracking-kit`. A **config carimba `account_id` + `slug`** em todos os eventos. É a porta de captura. Carrega a **marca do empreendimento** (não a do CRM).

### 2. tracking-kit (`tracking-kit/`)
Captura UTM, click IDs, jornada (20 toques), device, identidade (hash). Dispara browser + POST para o n8n. Deduplicação por `event_id`. Já existe — ver repo `rodrigoosouza/tracking-kit`.

### 3. n8n (`n8n/`)
O orquestrador server-side. Tudo que é segredo (tokens, API keys) e tudo que precisa ser confiável passa aqui. Ver fluxo acima. **Nunca** chamar IA/Apify/Firecrawl direto do browser.

### 4. Supabase (`supabase/`)
Fonte da verdade. Duas naturezas de dado convivem:
- **Log de eventos** (`tracking_events`): append-only, imutável. Para atribuição.
- **Estado de entidades** (leads, funil, notes, conversas): mutável. O CRM.

A ponte entre os dois é o **stitching**. Isolamento por **RLS** no `account_id`.

### 5. App (`apps/crm/`)
Cloudflare Pages (frontend React/Vite) + Workers (API Hono). Resolve o tenant pelo domínio na entrada, depois opera por `account_id`. White-label por config de conta.

## Duas naturezas de dado (conceito crítico)

| | Log de eventos | Estado de entidades (CRM) |
|---|---|---|
| Tabela | `tracking_events` | `leads`, `notes`, `funnel_*`, `conversations` |
| Natureza | append-only, imutável | mutável |
| Origem | browser → n8n | stitching + ações do corretor |
| Uso | atribuição, análise | trabalhar o lead |

**Não** transforme `tracking_events` no CRM. O CRM vive ao lado e se **alimenta** dos eventos via stitching.

## A ponte: stitching (anônimo → pessoa)

O lead navega anônimo (só `visitor_id`). Quando converte, o evento carrega email/telefone. O stitching:
1. pega todos os eventos daquele `visitor_id`;
2. resolve a identidade (regra de identidade — **decisão aberta**, ver `decisions/`);
3. cria/atualiza um `lead` com a jornada consolidada;
4. dispara dossiê + distribuição.

## Multi-tenancy

- **Pooled:** um banco, tabelas compartilhadas, isolamento por RLS no `account_id`.
- **White-label de domínio:** Cloudflare for SaaS (custom hostnames + SSL automático).
- **Saída de emergência (futuro):** cliente enterprise que exija silo → apontar o tenant para outro Supabase, sem reescrever (o código lê o tenant de config).

Detalhe completo em `03-modelo-de-dados.md`.

## Hospedagem (o que roda onde)

| Serviço | Onde |
|---|---|
| App (Pages + Workers) | Cloudflare |
| Banco + Auth | Supabase (gerenciado) |
| n8n | self-hosted (VPS / Railway / Render) |
| Evolution API | self-hosted (Docker, ao lado do n8n) |
| LPs | Cloudflare Pages |

A escolha da Cloudflare para o app **não** afeta n8n/Supabase/Evolution — eles são independentes.

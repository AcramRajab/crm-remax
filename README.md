# REMAX CRM — Plataforma de Marketing + Vendas Imobiliário

Plataforma **multi-tenant** que une **tracking de marketing**, **dashboard de atribuição** e um **CRM de vendas** com hub omnichannel (WhatsApp + e-mail), pensada para o mercado imobiliário e desenhada para ser **vendida em white-label** para outras imobiliárias.

> `remax-crm` é o nome de trabalho. A marca do produto é trocável — REMAX é o primeiro **cliente**, não o nome do produto.

## Em uma frase

Você cria a landing page de cada empreendimento, ela já nasce conectada ao tracking, o lead converte e cai no CRM com um **dossiê completo de navegação** gerado por IA, e o corretor trabalha o funil conversando por WhatsApp e e-mail **sem sair da plataforma**.

## Componentes

| Pasta | O que é |
|---|---|
| `apps/crm/` | O aplicativo (Cloudflare Pages + Workers). Dashboard de marketing + CRM. |
| `supabase/` | Banco de dados: schema, RLS multi-tenant, views de atribuição, função de stitching. |
| `n8n/` | Workflows de automação: ingestão de eventos, stitching, distribuição de leads, dossiê, mensageria. |
| `tracking-kit/` | Kit de captura de tracking (browser + servidor). Origem: `rodrigoosouza/tracking-kit`. |
| `landing-pages/` | Templates de LP por empreendimento. |
| `projetos-empreendimento/` | Conteúdo de cada empreendimento (personas, mídia, catálogo). |
| `planning/` | Toda a documentação de arquitetura e decisões. |
| `skills/` | Skills do agente para operar o sistema (criar empreendimento, onboarding). |

## Por onde começar (para desenvolver)

1. Leia **`CLAUDE.md`** (raiz) — é o resumo de arquitetura e as regras inquebráveis.
2. Leia **`planning/`** na ordem 01 → 10 para o contexto completo.
3. Confira **`planning/decisions/00-decisoes-abertas.md`** — há decisões ainda pendentes que afetam o que construir primeiro.

## Stack

Cloudflare (Pages + Workers + for SaaS) · Supabase (Postgres + RLS + Auth) · n8n · tracking-kit · Evolution API (WhatsApp) · OpenRouter (IA) · Apify + Firecrawl (enriquecimento).

## Princípios

- **Multi-tenant pooled** com isolamento por RLS (`account_id`). Nunca replicar banco por cliente.
- **Conta → Empreendimento (slug) → Lead → Corretor.** Slug único por conta.
- **Simplicidade do funil acima de tudo** — o CRM empurra o próximo contato humano.

---
_Documentação detalhada em `planning/`. Contexto para agentes em `CLAUDE.md`._

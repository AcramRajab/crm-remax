# CLAUDE.md — Contexto do projeto (REMAX CRM)

> Este arquivo é a **memória principal** do projeto. O Claude Code carrega ele automaticamente.
> Mantenha-o curto e aponte para `planning/` quando precisar de detalhe.

## O que é este projeto

Plataforma **multi-tenant** de **marketing + vendas** para o mercado imobiliário.
Une três coisas que normalmente vivem separadas:

1. **Tracking / marketing** — captura todo o comportamento de navegação dos leads (via `tracking-kit`) e guarda no Supabase.
2. **Dashboard de marketing** — atribuição (first/last/multi-touch), origem dos leads, performance por canal e persona.
3. **CRM de vendas** — funil topo/meio/fundo, leads com dossiê completo, hub omnichannel (WhatsApp + e-mail), anotações, tarefas e follow-up.

O primeiro cliente é a operação da **REMAX** dos sócios (Rodrigo + Acram). Depois a plataforma é **vendida para outras imobiliárias/corretores** (white-label).

> **Marca:** `remax-crm` é só o nome de trabalho. O produto é vendável e a marca deve ser **trocável** (não hardcodar "REMAX" em lugar nenhum de produto). REMAX é uma franquia (marca de terceiro) — tratada como o primeiro **cliente/conta** dentro da plataforma, não como o nome do produto.

## Modelo mental (leia antes de codar)

A hierarquia que governa **todo** o sistema:

```
Conta (imobiliária)            -> nível do white-label. Resolve pelo domínio do CRM.
  └── Empreendimento (slug)    -> ex.: now-residence. Uma conta tem VÁRIOS.
        └── Lead               -> a pessoa. Carrega o dossiê de navegação.
              └── Corretor     -> dono do lead, trabalha o funil.
```

**Regras inquebráveis:**

- **Toda** linha de **toda** tabela carrega `account_id` (a conta) + `empreendimento_id`/slug (o produto). Os dois explícitos, sempre.
- **Isolamento por RLS** no `account_id`. O cliente A nunca enxerga dado do cliente B, mesmo sendo a mesma tabela. Nunca confie em filtro de aplicação para segurança — a RLS é a barreira.
- **Domínio NÃO é chave de dado.** O domínio só serve para *descobrir qual conta* na entrada (login do CRM) ou *onde a LP está hospedada*. Depois disso, tudo filtra por `account_id` (estável), nunca pela string do domínio (que muda).
- **Slug é único por conta, não global.** `(account_id, slug)` é a chave. Duas imobiliárias podem ter um empreendimento `now-residence` cada uma sem conflito.
- **O slug é carimbado na origem** (na config de tracking da LP), não deduzido. Viaja no payload do evento.
- **Multi-tenant é pooled** (todos no mesmo banco). NÃO replicar banco por cliente. Exceção futura (cliente enterprise que exija silo) deve ser possível só apontando o tenant para outro banco — por isso o código sempre lê o tenant de uma config, nunca hardcoda.

## Stack

| Camada | Tecnologia |
|---|---|
| App (CRM + dashboard) | **Cloudflare Pages + Workers** (sugestão: React/Vite no Pages + API Hono no Workers) |
| Banco de dados | **Supabase** (Postgres + RLS + Auth) |
| Automação / orquestração | **n8n** (self-hosted) |
| Tracking | **tracking-kit** (vanilla JS no browser + n8n + Supabase) |
| WhatsApp | **Evolution API** (self-hosted, não-oficial; conexão por QR; uma instância hospeda vários números) |
| E-mail | provedor transacional (MailerSend / Resend / SES) — enviar e **receber** (inbound) no thread do lead |
| IA (dossiê) | **OpenRouter** (texto/LLM) — **não** fal.ai (fal.ai fica para criativos no futuro) |
| Enriquecimento | **Apify** (perfis sociais, portais, maps) + **Firecrawl** (site → markdown para a IA) |
| White-label de domínio | **Cloudflare for SaaS** (custom hostnames + SSL automático) |

**Domínios de credenciais:**
- **Plataforma (nossas, uma vez):** Apify, Firecrawl, OpenRouter, n8n, Supabase, Cloudflare, Evolution API, provedor de e-mail.
- **Cliente (dele, por conta):** Meta Pixel + token CAPI, Google Ads, GA4, TikTok, Clarity, domínio + identidade visual.
- Regra: se é infra que operamos → plataforma. Se é "conta de anúncio dele / para onde o dado dele vai" → cliente.

## Como o lead nasce (fluxo central)

1. Visitante navega na **LP** (que **nós** criamos). A LP carimba `account_id` + `slug` em cada evento de tracking.
2. Eventos sobem para o **n8n** → valida/carimba a conta (não confia no browser) → grava em `tracking_events` no Supabase + dispara pixels (Meta CAPI, GA4, etc.).
3. Quando o visitante **converte** (form ou clique no WhatsApp), o evento `Lead` carrega a identidade (email/telefone).
4. O **stitching** (função no Supabase / n8n) junta todos os eventos daquele `visitor_id` + identidade → materializa um **lead** no CRM com a jornada completa.
5. Na entrada no CRM, dispara o **dossiê** (OpenRouter + Apify/Firecrawl no n8n) e a **distribuição** (regra configurável por conta) atribui o lead a um corretor.
6. Corretor trabalha o lead no funil, conversa por **WhatsApp/e-mail dentro da plataforma**, faz follow-up (5–12 contatos antes do descarte — filosofia do Acram).

## Filosofia do funil (do Acram — não perder de vista)

> "O corretor é eficaz quando lida com gente." O CRM existe para empurrar o **próximo contato humano**, não para virar um banco de dados que o corretor odeia preencher.

- **Topo:** inbound / outbound / indicação, com **ICP/persona claro por empreendimento**.
- **Meio:** follow-up de **5 a 12 contatos** antes do descarte; descarte aciona automação de nutrição leve (não spam).
- **Fundo:** CTA para encontro **presencial** (ideal) ou online — conexão humana.

Mantenha **simples**. Quando em dúvida sobre adicionar complexidade: o corretor vai usar isso ou vai fugir dele?

## Estrutura do repositório

```
.claude/                  config do agente (este arquivo de contexto vive na raiz como CLAUDE.md)
planning/                 arquitetura, modelo de dados, features, decisões (ADRs), roadmap
skills/                   skills do agente (criar empreendimento, onboarding de cliente...)
apps/crm/                 o app (Cloudflare Pages + Workers) — placeholder até começar
supabase/                 schema, migrations, RLS, views, functions (stitching) — SQL draft
n8n/                      workflows exportados (ingest, stitching, distribuição, dossiê, mensageria)
tracking-kit/             o kit de captura (referenciado do repo rodrigoosouza/tracking-kit)
landing-pages/            templates de LP por empreendimento (nós criamos)
projetos-empreendimento/  conteúdo por empreendimento (personas, mídia, catálogo) — JÁ EXISTE
logo remax/               assets de marca do primeiro cliente
```

## Onde achar detalhe

- Visão e modelo de negócio → `planning/01-visao-e-negocio.md`
- Arquitetura do sistema → `planning/02-arquitetura.md`
- Modelo de dados + multi-tenancy/RLS → `planning/03-modelo-de-dados.md`
- Tracking + stitching → `planning/04-tracking-e-stitching.md`
- CRM (funil, leads, omnichannel, distribuição, papéis) → `planning/05-crm.md`
- Dashboard de marketing → `planning/06-dashboard-marketing.md`
- Dossiê IA → `planning/07-dossie-ia.md`
- Empreendimentos + LP → `planning/08-empreendimentos-e-lp.md`
- Onboarding + credenciais → `planning/09-onboarding-e-credenciais.md`
- Roadmap e fases → `planning/10-roadmap.md`
- Decisões fechadas (ADRs) → `planning/decisions/`
- **Decisões abertas (pendentes com o Acram)** → `planning/decisions/00-decisoes-abertas.md`

## Status do projeto

- **Fase atual:** scaffold / planejamento. Ainda não há código de app.
- **Pendente de decisão (Acram):** por onde começar a construir; regra de identidade do lead. Ver `planning/decisions/00-decisoes-abertas.md`.

# 10 — Roadmap e Fases

> Sequenciar é a maior defesa contra o risco do projeto. A visão é grande; entregar em ondas.
> **Por onde começar é decisão aberta** (ver `decisions/00-decisoes-abertas.md`). O roadmap abaixo assume o default recomendado: **Now Residence ponta a ponta sobre fundação multi-tenant**.

## Fase 0 — Fundação (este scaffold)
- [x] Documentação de arquitetura e decisões
- [ ] Provisionar infra: Supabase, n8n, Cloudflare, Evolution API
- [ ] Schema base no Supabase (accounts, empreendimentos, users, tracking_events multi-tenant) + RLS
- [ ] Migrar tracking-kit para modelo central (V2): account_id + slug carimbados, RLS ativa

## Fase 1 — Now Residence ponta a ponta (o case)
Objetivo: provar o fluxo completo com um empreendimento real.
- [ ] LP do Now Residence com tracking conectado (carimba account+slug)
- [ ] Ingestão de eventos no n8n → tracking_events + pixels
- [ ] Stitching anônimo→lead (regra de identidade — confirmar)
- [ ] CRM mínimo: funil + tela do lead + jornada de navegação
- [ ] Distribuição de leads (rodízio default)
- [ ] Dossiê IA na entrada (OpenRouter + Firecrawl/Apify)

## Fase 2 — Hub omnichannel
- [ ] WhatsApp via Evolution API (conexão por QR, conversa in/out no lead)
- [ ] E-mail (enviar + inbound no thread)
- [ ] Camada de mensagens agnóstica
- [ ] Anotações, tarefas, follow-up (regra 5–12), automação de descarte

## Fase 3 — Dashboard de marketing
- [ ] Atribuição (first/last/multi-touch)
- [ ] Origem, funil, performance por persona
- [ ] CAC por canal/persona
- [ ] Look-alike / Custom Audience (Meta)

## Fase 4 — Multi-tenant / white-label completo
- [ ] Onboarding self-service de conta (credenciais do cliente)
- [ ] White-label: domínio customizado (Cloudflare for SaaS) + identidade visual
- [ ] Distribuição configurável (UI da regra)
- [ ] Papéis e RLS refinados (super_admin / account_admin / broker)
- [ ] Template de empreendimento clonável (skill `criar-empreendimento`)

## Fase 5 — Produto vendável
- [ ] Segundo cliente real (outra imobiliária)
- [ ] Contrato de tratamento LGPD + direito ao esquecimento ponta a ponta
- [ ] Otimização de custo de IA (score / sob demanda)
- [ ] Precificação baseada em custo por lead

## Marco da apresentação GBER
A arquitetura (este repo) + Now Residence são a base da apresentação para a construtora. Pode ser o **primeiro entregável** (material de apresentação) antes do código, dependendo da agenda — confirmar com o Acram.

---
**Regra de sequência:** não construir a plataforma genérica inteira antes de ter um caso real no ar. Now Residence valida; depois generaliza.

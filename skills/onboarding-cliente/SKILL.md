---
name: onboarding-cliente
description: Cadastra uma imobiliária/cliente nova na plataforma — conta, white-label, credenciais de marketing e o primeiro empreendimento. Use ao trazer um novo cliente para o CRM.
---

# Onboarding de Cliente

Cadastra uma **conta** (imobiliária) nova, no modelo white-label. O cliente só vai operar o CRM; nós montamos o resto.

## Passo a passo

### 1. Criar a conta
Inserir em `accounts`: `slug` (da conta), `name`, branding (`brand_name`, `logo_url`, `primary_color`). Status `active`.

### 2. White-label / domínio
- Definir `custom_domain` do CRM.
- Cliente aponta o DNS → Cloudflare for SaaS resolve SSL.

### 3. Credenciais de marketing do cliente
Coletar pixels do cliente (conta de anúncio **dele**): Meta Pixel + token CAPI, Google Ads, GA4, TikTok, Clarity.
- IDs públicos → `account_marketing_credentials`.
- Tokens sensíveis → Vault / secrets do n8n (não texto puro).
- Usar guia com print (reaproveitar `tracking-kit/docs/PIXELS.md`) para CAPI/Google Ads.

### 4. Distribuição de leads
Definir `accounts.lead_distribution_rule` (default `round_robin` já vem ligado).

### 5. Usuários
- Criar `account_admin` (dono) via Supabase Auth + `memberships`.
- Adicionar corretores (`broker`).

### 6. Primeiro empreendimento
Rodar a skill `criar-empreendimento`.

### 7. WhatsApp
Cada corretor conecta o número por QR (Evolution API).

### 8. Validar ponta a ponta
Lead de teste → cai no CRM → distribuído → dossiê gerado → corretor consegue responder por WhatsApp/e-mail dentro da plataforma.

## Lembretes
- **Credenciais do cliente** = pixels/Ads dele. **Plataforma** = Apify/Firecrawl/OpenRouter/n8n/Supabase/Cloudflare/Evolution (nossas).
- **LGPD:** assinar contrato de tratamento de dados (somos operador, cliente é controlador).

## Referências
- `planning/09-onboarding-e-credenciais.md`
- `planning/05-crm.md` (papéis, distribuição)

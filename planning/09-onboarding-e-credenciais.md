# 09 — Onboarding e Credenciais

## Os dois baldes de credenciais

### Plataforma (nossas, uma vez só)
Infra que **nós** operamos e pagamos. O cliente nunca vê.
- Apify, Firecrawl, OpenRouter
- n8n, Supabase, Cloudflare
- Evolution API
- provedor de e-mail (MailerSend/Resend/SES)

### Cliente (dele, por conta)
A conta de anúncio dele / para onde o dado dele vai.
- Meta Pixel ID + token CAPI
- Google Ads ID
- GA4 ID
- TikTok ID
- Clarity ID
- domínio customizado + identidade visual (logo, cores)

**Regra:** infra que operamos → plataforma. Conta de anúncio dele → cliente.

> O cliente **só troca tracking/pixel/Ads**. O resto é motor da casa.

## Onde guardar as credenciais do cliente

**Não** em texto puro numa coluna qualquer. Preferir:
- secrets do n8n por tenant, ou
- tabela dedicada com criptografia / Supabase Vault.
A RLS protege o acesso, mas tokens merecem camada extra.

## Fluxo de onboarding de um cliente novo

```
1. Criamos a CONTA (account) + branding (white-label)
2. Cliente fornece credenciais de tracking (pixel/Ads/GA4/TikTok)
3. Criamos o(s) EMPREENDIMENTO(s) + personas
4. Criamos a LANDING PAGE conectada (carimba account+slug, dispara pros pixels dele)
5. Cliente aponta o DOMÍNIO (DNS) — Cloudflare for SaaS resolve SSL
6. Corretores entram, conectam o WhatsApp (QR/Evolution)
7. Configura a regra de DISTRIBUIÇÃO (default rodízio já ligado)
8. Cliente (ou nós) ANUNCIA → leads caem no CRM
```

### Ordem importa
Como **nós** construímos a LP já conectada ao pixel **do cliente**, precisamos das credenciais de tracking dele **antes** de publicar a LP.

## Pontos de fricção (honestos)

A maior parte é "cola e funciona", mas dois exigem passo a passo:

1. **Meta CAPI / Google Ads:** o cliente gera o token dentro do Business Manager / Google Ads dele. 3–4 cliques, mas não é "cola um número". → Fazer **guia de onboarding com print** (reaproveitar `tracking-kit/docs/PIXELS.md`) ou um assistente que conduz.
2. **Domínio customizado:** apontar DNS. Cloudflare automatiza o SSL, mas o cliente menos técnico vai querer ajuda.

Fora esses, é "preenche e está no ar". Com bom onboarding guiado, o cliente faz sozinho em 15–20 min.

## LGPD — requisito de venda, não opcional

- Ao hospedar dados de leads de vários clientes, somos **operador** e o cliente é **controlador**.
- Exige **contrato de tratamento de dados** entre nós e cada cliente.
- Consentimento na LP (consent gate do kit).
- Direito ao esquecimento ponta a ponta: apagar do Supabase **e** das audiências/pixels.

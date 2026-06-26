# apps/crm/

O aplicativo: **Dashboard de marketing + CRM** (multi-tenant, white-label).

> 🚧 Placeholder. Ainda não há código — começa na Fase 1 do roadmap.

## Stack sugerida (ADR 0004)

- **Frontend:** React + Vite, hospedado no **Cloudflare Pages**.
- **Backend/API:** **Hono** nos **Cloudflare Workers**.
- **Banco/Auth:** Supabase (cliente JS com RLS).
- **Charts:** Chart.js (dashboard).
- **White-label de domínio:** Cloudflare for SaaS (custom hostnames).

> Next.js também roda na Cloudflare (OpenNext), mas React+Hono é mais simples p/ controlar o tenant. Decisão final do framework ao iniciar.

## Responsabilidades

1. **Resolver o tenant** pelo hostname na entrada → descobrir a conta → autenticar → JWT carrega `account_id` (+ papel, `is_super_admin`). A partir daí, RLS isola tudo.
2. **Dashboard de marketing** — atribuição, origem, persona, CAC (lê views do Supabase). Ver `planning/06-dashboard-marketing.md`.
3. **CRM** — funil, tela do lead (dossiê + jornada + omnichannel + notas + tarefas), aba Empreendimentos. Ver `planning/05-crm.md`.
4. **White-label** — aplicar marca da conta (logo, cores) resolvida pelo domínio.

## Estrutura sugerida (quando começar)

```
apps/crm/
├── web/            # React + Vite (Pages)
│   ├── src/
│   │   ├── routes/         # dashboard, funil, lead, empreendimentos, settings
│   │   ├── lib/tenant.ts   # resolução de tenant + branding
│   │   └── lib/supabase.ts
├── api/            # Hono (Workers)
│   ├── src/
│   │   ├── auth/           # login, JWT com account_id/role
│   │   ├── tenant/         # resolução por hostname
│   │   └── routes/         # endpoints que o n8n e o web chamam
└── wrangler.toml
```

## Regras (do CLAUDE.md)

- Toda query passa pelo tenant. Nunca filtrar por domínio (string) — sempre por `account_id`.
- Camada de mensagens **agnóstica** (whatsapp/email) — não acoplar Evolution na UI.
- Simplicidade do funil acima de tudo.

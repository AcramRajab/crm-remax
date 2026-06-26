# ADR 0004 — Stack Cloudflare + Supabase + n8n

**Status:** ✅ fechado

## Contexto
Os sócios já têm **n8n, Supabase e Cloudflare**. Precisamos do app (CRM + dashboard), banco, automação e white-label de domínio.

## Decisão
| Camada | Tecnologia |
|---|---|
| App | **Cloudflare Pages + Workers** (sugestão: React/Vite no Pages + API Hono no Workers) |
| Banco + Auth | **Supabase** (Postgres + RLS + Auth) |
| Automação | **n8n** (self-hosted) |
| White-label de domínio | **Cloudflare for SaaS** (custom hostnames + SSL automático) |

## Por que Cloudflare
- Já no stack dos sócios.
- **Cloudflare for SaaS** é feito para white-label multi-tenant: cada cliente aponta o domínio dele e o SSL é automático para centenas de domínios. Vantagem direta sobre Vercel nesse ponto.

## Nuance: framework no Workers
Next.js roda na Cloudflare (via OpenNext), mas com ajustes. Para um CRM multi-tenant, **React (Vite) no Pages + API Hono nos Workers** é mais simples de controlar o tenant. Decisão final do framework na hora de iniciar `apps/crm/`.

## Consequências
- n8n, Supabase e Evolution são **independentes** da escolha do app — hospedados à parte.
- Resolução de tenant pelo hostname acontece no edge (Workers), depois opera por `account_id`.

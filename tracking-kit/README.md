# tracking-kit/

Kit de captura de tracking. **Origem:** [`rodrigoosouza/tracking-kit`](https://github.com/rodrigoosouza/tracking-kit).

> 🚧 Placeholder. Ainda não integrado. Decidir cópia vs submódulo (decisão aberta #5).

## Papel no projeto

A camada de captura: vanilla JS no browser + fluxo n8n + Supabase. Captura UTMs, click IDs, jornada (20 toques), device, identidade (hash), com atribuição multi-touch e disparo server-side (Meta CAPI, GA4 MP, TikTok) deduplicado por `event_id`.

## O que precisa mudar para este projeto (V1 → V2 multi-tenant)

1. Config da LP carimba **`account_id` + `slug`** (hoje só `client_name`).
2. `tracking_events` ganha `account_id`/`empreendimento_id` (ver `supabase/migrations/05-tracking-events.sql`).
3. n8n **valida/carimba a conta** no server (anti-spoof).
4. Ativar **RLS** central (o kit já tem `02-rls.sql` pronto; schema já indexa `client_name`).

## Como integrar (decisão aberta #5)

- **Cópia (vendoring):** copiar o kit para cá. Mais fácil evoluir p/ V2. Perde sincronia com o original.
- **Submódulo git:** `git submodule add https://github.com/rodrigoosouza/tracking-kit`. Mantém sincronia.

Decidir na hora de integrar — não bloqueia nada agora.

## Docs úteis do kit (no repo original)

`docs/ARQUITETURA.md`, `docs/ATRIBUICAO.md`, `docs/PIXELS.md` (reaproveitar no onboarding), `docs/LGPD.md`, `docs/PRESETS.md`, `docs/ROADMAP.md` (V2/V3).

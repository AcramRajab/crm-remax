# 04 — Tracking e Stitching

## O que o tracking-kit já entrega

Repo: `rodrigoosouza/tracking-kit`. Resumo do que importa aqui:

- Captura **UTMs**, 11 **click IDs** (gclid, fbclid, ttclid, ctwa_clid...), **jornada** de 20 toques, device, referrer.
- Três versões de atribuição simultâneas: **first-touch** (`ft_*`), **last-touch** (`lt_*`), **journey** (jsonb).
- `visitor_id` (UUID, cookie 2 anos) + `session_id` + `external_id` (SHA-256 do email).
- Server-side via n8n: **Meta CAPI, GA4 MP, TikTok Events API** + insert no Supabase.
- Deduplicação browser↔servidor por `event_id`.
- Presets de negócio (lead-gen-form, lead-gen-whatsapp, híbrido, agendamento...). Para imobiliário: **lead-gen-hibrido** (form + WhatsApp).

## O que muda para multi-tenant

1. **A config da LP carimba `account_id` + `slug`** em todos os eventos (hoje o kit tem só `client_name`). O `client_name` passa a ser o slug; adiciona-se `account_id`.
2. **O n8n valida e carimba a conta** no server, sem confiar no `account_id` que veio do browser (anti-spoof). Mapeia a origem (path da LP / domínio) → conta correta.
3. **`tracking_events` ganha `account_id` e `empreendimento_id`** explícitos + índice composto.
4. Migrar o kit do modelo V1 (1 Supabase por cliente) para o **V2 central** (RLS por tenant) — o roadmap do próprio kit já prevê isso e o schema já tem `client_name` indexado.

## O que é stitching

A **costura** entre o log anônimo de eventos e a entidade lead do CRM.

```
visitor_id navega anônimo  →  events: PageView, Scroll, ViewContent...
        │
        ▼ (converte: form ou clique WhatsApp)
event "Lead" carrega email/telefone
        │
        ▼ STITCHING
  1. junta todos os eventos do visitor_id
  2. resolve identidade (email_hash → phone_hash → merge)
  3. cria/atualiza lead com jornada consolidada + atribuição
  4. dispara dossiê + distribuição
```

### Onde roda
No **n8n** (ou função no Supabase chamada pelo n8n). É server-side, idempotente, e roda no momento da conversão.

### Identidade (DECISÃO ABERTA)
Regra que define o que é "a mesma pessoa". Ver `decisions/00-decisoes-abertas.md`.
Default proposto:
1. casar por `email_hash`; se não houver, por `phone_hash`;
2. se um mesmo email aparece com dois `visitor_id` (dois devices), **mesclar** num lead só, acumulando os visitor_ids;
3. botão de **merge/split manual** no CRM para casos que a automação errar.

## Atribuição (já vem do kit)

Views no Supabase: `v_atribuicao_first_touch`, `v_atribuicao_last_touch`, `v_atribuicao_linear`. Usadas pelo dashboard de marketing (`06-dashboard-marketing.md`).

Cada lead guarda um snapshot da própria atribuição para o dossiê e para o corretor ver "de onde veio".

## CTWA (Click to WhatsApp) — importante no imobiliário

O kit captura `ctwa_clid` separado. No fluxo híbrido, muitos leads vêm pelo clique no WhatsApp do anúncio. O n8n usa o `ctwa_clid` para montar a Meta CAPI com `action_source: business_messaging`. Esse lead também precisa ser **stitchado** — o clique no WhatsApp é uma conversão, e a conversa entra no hub omnichannel (ver `05-crm.md`).

## LGPD

- Consentimento na LP (o kit tem consent gate).
- Email em texto puro tem peso de LGPD — preferir `email_hash` onde der.
- Direito ao esquecimento deve apagar do Supabase **e** das audiências/pixels. Ver `09-onboarding-e-credenciais.md`.

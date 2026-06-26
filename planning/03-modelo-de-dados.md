# 03 — Modelo de Dados e Multi-tenancy

> O SQL draft vive em `supabase/migrations/`. Este doc explica o **porquê**.

## Hierarquia

```
account (imobiliária)        -- tenant do white-label
  └── empreendimento (slug)  -- vários por conta. chave: (account_id, slug)
        └── lead             -- a pessoa
              ├── notes, activities, tasks
              ├── conversations → messages (whatsapp/email)
              └── dossie
```

## Regras de ouro (repetidas do CLAUDE.md porque são a espinha dorsal)

1. **Toda tabela de domínio carrega `account_id`.** As tabelas ligadas a empreendimento também carregam `empreendimento_id`.
2. **RLS isola por `account_id`.** Segurança é no banco, não na aplicação.
3. **Domínio nunca é chave de dado.** Só resolve a conta na entrada.
4. **Slug é único por conta** (`unique (account_id, slug)`), não global.
5. **Tenant lido de config**, nunca hardcoded — preserva a saída para silo futuro.

## Entidades principais

### `accounts`
A imobiliária / cliente. Nível do white-label.
- `id`, `name`, `slug` (da conta, único global — usado em URLs internas)
- `status` (active/suspended)
- white-label: `brand_name`, `logo_url`, `primary_color`, `custom_domain`
- credenciais de marketing do cliente (idealmente em tabela à parte / secrets do n8n, **não** em texto puro): `meta_pixel_id`, `meta_capi_token`, `google_ads_id`, `ga4_id`, `tiktok_id`, `clarity_id`
- config de distribuição de leads (`lead_distribution_rule` — ver `05-crm.md`)

### `empreendimentos`
O produto imobiliário. **Vários por conta.**
- `id`, `account_id` (FK), `slug` (único **por conta**), `name`
- `status`, `construtora`, dados do empreendimento
- `personas` (jsonb) — o ICP, ex.: as 6 personas do Now Residence
- referência à LP (`landing_page_url`)
- `unique (account_id, slug)`

### `users` + `memberships`
- `users`: conta de acesso (via Supabase Auth).
- `memberships`: liga `user` ↔ `account` com um `role`.
- **Papéis:** `super_admin` (nós, vê tudo), `account_admin` (dono da imobiliária, vê toda a conta), `broker` (corretor, vê os próprios leads).
- Um usuário pode pertencer a mais de uma conta (útil para nós).

### `tracking_events` (do tracking-kit + extensão)
O log append-only. Schema base vem do `tracking-kit` (`client_name`, `event_id`, `visitor_id`, UTMs ft/lt, click IDs, journey jsonb, etc.).
**Extensão multi-tenant:** adicionar `account_id` e `empreendimento_id` explícitos. O `client_name` do kit passa a guardar o slug.
- Índice composto: `(account_id, empreendimento_id, event_time desc)`.

### `leads`
Materializado pelo stitching. O coração do CRM.
- `id`, `account_id`, `empreendimento_id`
- identidade: `email`, `phone`, `email_hash`, `visitor_id` (e histórico de visitor_ids)
- atribuição consolidada: first-touch, last-touch, origem
- `persona` (estimada), `score`
- `stage_id` (etapa do funil), `owner_id` (corretor), `status` (active/won/lost/discarded)
- `discard_reason`, contadores de follow-up
- `journey` (jsonb, snapshot da jornada)

### `funnel_stages`
Etapas do funil. Default topo/meio/fundo, **configurável por conta** (ou por empreendimento).
- `id`, `account_id`, `name`, `position`, `phase` (topo/meio/fundo)

### `lead_notes`, `lead_activities`, `lead_tasks`
- `notes`: anotações livres do corretor.
- `activities`: histórico (mudou de etapa, contato feito, etc.).
- `tasks`: follow-up agendado (suporta a regra dos 5–12 contatos).

### `conversations` + `messages`
Hub omnichannel.
- `conversations`: uma por (lead, canal). Canais: `whatsapp`, `email`.
- `messages`: cada mensagem in/out, com `direction`, `body`, `channel`, `status`, `external_id`.

### `dossie`
- `id`, `lead_id`, `account_id`
- `content` (texto gerado), `model`, `sources` (jsonb: o que Apify/Firecrawl trouxeram)
- `generated_at`. Gerado quando o lead entra no CRM (decisão fechada).

## RLS — como funciona

Toda tabela de domínio tem policy do tipo:

```sql
-- pseudo-policy
using ( account_id = current_account_id() )
```

`current_account_id()` vem de um **JWT claim** (Supabase Auth) que carrega o `account_id` da sessão. O frontend resolve o domínio → descobre a conta → autentica → o JWT carrega o `account_id` → a RLS filtra tudo automaticamente.

- `super_admin` tem policy adicional que permite ver todas as contas (claim `is_super_admin`).
- `broker` tem policy extra em `leads`: `owner_id = auth.uid()` (vê só os próprios) — a menos que a conta configure visão de equipe.

Ver `supabase/migrations/08-rls.sql`.

## Identidade do lead (DECISÃO ABERTA)

O que faz dois eventos serem "a mesma pessoa"? email? telefone? os dois? E se o cara converte em dois devices?
Isso define se o corretor vê **um dossiê unificado** ou **leads duplicados**.
→ Ver `decisions/00-decisoes-abertas.md`. Default proposto: resolver por `email_hash` primeiro, depois `phone_hash`, com merge manual disponível no CRM.

## Por que pooled e não banco por cliente

Replicar banco por cliente = a dor do `tracking-kit` V1 (atualizar N instâncias uma a uma). Pooled = atualiza uma vez, todos recebem. RLS dá o isolamento. É como praticamente todo SaaS funciona. Performance: índice composto em `account_id` mantém queries rápidas mesmo com a tabela gigante.

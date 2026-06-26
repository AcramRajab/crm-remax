# ADR 0002 — Slug único por conta; account_id e slug separados

**Status:** ✅ fechado

## Contexto
Uma conta (imobiliária) tem **vários empreendimentos**. Vários slugs, e eles **podem repetir entre imobiliárias** (duas clientes podem ter um `now-residence` cada). Domínio e slug são eixos **independentes** (o domínio da LP, o domínio do CRM e o slug não precisam coincidir).

O `tracking-kit` tem hoje um campo único `client_name` (texto).

## Decisão
1. **Slug é único por conta, não global.** Chave real: `(account_id, slug)`. Constraint `unique (account_id, slug)`.
2. **Guardar `account_id` e `empreendimento`/slug como colunas separadas**, não uma string composta. A RLS precisa do `account_id` isolado.
3. O `client_name` do kit passa a guardar o **slug**; adiciona-se `account_id` ao lado.
4. **Domínio não é chave de dado** — só resolve a conta na entrada (CRM) ou indica onde a LP está hospedada.

## Consequências
- Sem colisão de slug entre clientes. Espaço de nomes por conta.
- Filtragem/índice/RLS limpos: `(account_id, empreendimento_id, ...)`.
- O slug é **carimbado na origem** (config da LP), não deduzido do domínio.

## Exemplo
`remax-itajai` + `now-residence` e `imobiliaria-y` + `now-residence` são linhas distintas — sem conflito.

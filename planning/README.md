# planning/ — Documentação do projeto

Ler na ordem para entender o sistema inteiro.

| # | Doc | Sobre |
|---|---|---|
| 01 | [Visão e Negócio](01-visao-e-negocio.md) | Problema, tese, filosofia do funil, modelo de negócio, marca |
| 02 | [Arquitetura](02-arquitetura.md) | Componentes, fluxo central, duas naturezas de dado, hospedagem |
| 03 | [Modelo de Dados](03-modelo-de-dados.md) | Entidades, multi-tenancy, RLS, identidade do lead |
| 04 | [Tracking e Stitching](04-tracking-e-stitching.md) | tracking-kit, costura anônimo→lead, atribuição, CTWA |
| 05 | [CRM](05-crm.md) | Funil, tela do lead, omnichannel, distribuição, papéis, empreendimentos |
| 06 | [Dashboard Marketing](06-dashboard-marketing.md) | Atribuição, origem, persona, CAC, look-alike |
| 07 | [Dossiê IA](07-dossie-ia.md) | OpenRouter + Apify + Firecrawl, quando gera, LGPD |
| 08 | [Empreendimentos e LP](08-empreendimentos-e-lp.md) | Template replicável, LP, Now Residence |
| 09 | [Onboarding e Credenciais](09-onboarding-e-credenciais.md) | Dois baldes de credenciais, fluxo, fricção, LGPD |
| 10 | [Roadmap](10-roadmap.md) | Fases e sequência |

## Decisões

- `decisions/` — registro das decisões de arquitetura (ADRs).
- **`decisions/00-decisoes-abertas.md`** — o que ainda falta decidir (com o Acram). **Comece por aqui** se for definir prioridade.

## Convenções

- Docs em PT-BR.
- Quando uma decisão muda, atualize o ADR correspondente e o doc afetado.
- O `CLAUDE.md` da raiz é o resumo executivo — mantenha-o em sincronia com mudanças grandes aqui.

# ADR 0005 — Dossiê gerado na entrada do lead no CRM

**Status:** ✅ fechado

## Contexto
O "dossiê empresarial" gerado por IA é diferencial do produto. Quando gerar: sob demanda (corretor clica) ou pré-gerado na conversão?

## Decisão
Gerar **no momento em que o lead entra no CRM** (na conversão / stitching). O lead já chega no funil com os dados de marketing/tracking **e** o dossiê pronto.

Ferramentas: **OpenRouter** (LLM/texto) + **Firecrawl** (páginas→markdown) + **Apify** (perfis/portais). **Não** fal.ai (mídia, fica para criativos).

## Consequências
- Corretor abre o lead e o dossiê já está lá (instantâneo).
- **Custo:** roda em todo lead que converte, inclusive frios. Aceitável por ora.
- Tudo no **n8n / server-side** (API keys da plataforma não vazam; controle LGPD do que é enviado).
- Cacheado em `dossie`; regenerar só sob pedido ou sinal novo.

## Otimização futura (não agora)
Se o volume crescer: enriquecer só leads acima de um `score`, ou só quando o corretor abrir. Simples primeiro.

## Relacionado
`07-dossie-ia.md`.

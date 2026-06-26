# 07 — Dossiê do Lead (IA)

## O que é

O **brilho do produto**. Quando o lead entra no CRM, a IA gera um perfil **acionável** para o corretor:

> "Visitou plantas de 1 dorm 3x, veio de anúncio de short-stay, provável **investidor pré-lançamento**. Abordar pelo ângulo de valorização (14–20% em Itajaí). Trabalha com comércio exterior (LinkedIn)."

Comportamento (tracking) + contexto externo (enriquecimento) = dossiê de verdade, não só "veio do Instagram".

## Quando é gerado

**No momento em que o lead entra no CRM** (na conversão / stitching). Decisão fechada com o Rodrigo.
- Implica: roda em **todo** lead que converte (inclusive frios). Custo consciente — ver `01-visao-e-negocio.md` e otimização abaixo.

## Como é gerado (fluxo, tudo no n8n / server-side)

```
lead criado (stitching)
      │
      ▼
1. coleta sinais do tracking (jornada, persona estimada, origem, páginas)
2. ENRIQUECE:
     - Firecrawl: site da empresa / página de origem → markdown limpo
     - Apify: perfis sociais / portais / maps a partir de email/telefone
3. monta prompt → OpenRouter (LLM) → texto do dossiê
4. grava em `dossie` (content + model + sources + generated_at), cacheado
```

## Ferramentas

| Ferramenta | Papel |
|---|---|
| **OpenRouter** | LLM que escreve o dossiê. Endpoint único para vários modelos (Claude/GPT/Gemini) — troca modelo sem reescrever, controla custo. |
| **Firecrawl** | Lê páginas (site da empresa, anúncio, concorrente) → markdown para a IA. |
| **Apify** | Coleta de fontes não-triviais: perfis sociais, portais imobiliários (ZAP/VivaReal), Google Maps. |

> **fal.ai não entra aqui** — é geração de mídia (imagem/vídeo). Guardar para criativos de anúncio no futuro, não para o dossiê (que é texto).

## Onde roda (segurança)

**Sempre no n8n**, nunca no browser:
- as API keys (OpenRouter/Apify/Firecrawl) são **da plataforma**, não podem vazar;
- passamos dado pessoal do lead — precisa de log/controle do que foi enviado (LGPD).

## LGPD (atenção redobrada)

- O tracking é **first-party** (o cara navegou no nosso site). O enriquecimento é **third-party** sobre uma pessoa — zona mais sensível.
- Marcar no dossiê o que é "informação pública estimada".
- Respeitar direito ao esquecimento (apagar dossiê + fontes).

## Otimização de custo (futuro, não agora)

Como roda em todo lead que converte, o custo escala. Opções para depois:
- enriquecer só leads acima de um `score`;
- ou só quando o corretor de fato abrir o lead (sob demanda com cache);
- cache: gerar uma vez, não a cada abertura.

Por ora: gera na entrada, cacheado. Simples primeiro.

## Cache

`dossie` é cacheado por lead. Regenerar só sob pedido explícito (botão "atualizar dossiê") ou se chegar sinal novo relevante.

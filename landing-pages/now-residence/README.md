# landing-pages/now-residence/

Landing page do empreendimento **NOW Residence** (Itajaí — SC), primeiro case da plataforma.
Conta: **REMAX** · slug: **`now-residence`**.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | A LP. Single-file (Tailwind CDN + GSAP/ScrollTrigger/Lenis), self-contained. |
| `design-system.html` | Living design system do empreendimento — tokens, tipografia, cores, componentes, motion. Gerado seguindo `referencias.../Extract HTML Design System.md`. |
| `tracking.config.js` | Carimba `account_id` + `slug` em cada evento e configura WhatsApp/pixels (preset `lead-gen-hibrido`). |
| `assets/` | 21 renders oficiais otimizados (webp, ~4 MB no total). |

## Design system (extraído do catálogo oficial)

Fonte da verdade: `projetos-empreendimento/now-residence-remax/materiais now residence/NOW RESIDENCE - CATALOGO WEB .pdf`.

**Cores**
- Magenta NOW (assinatura): `#EC008C` · hover `#C2006F`
- Charcoal (fundo): `#181818` · darker/footer `#0E0E0E` · card `#232323`
- Cream (seções claras): `#F3F1ED` · branco `#FFFFFF`

**Tipografia**
- Display: **Anton** (uppercase pesado condensado) — títulos.
- Wordmark: **Comfortaa** (geométrico arredondado) — aproxima o logo "NOW".
- Corpo: **Manrope**.

**Assinatura visual:** linhas de contorno topográficas (SVG gerado, `data-topo="N"`).

> O wordmark NOW é uma aproximação tipográfica. Quando houver o **SVG oficial** do logo, substituir os elementos `.wordmark`.

## Referência de layout

Estrutura/animações inspiradas em `referencias de lp para empreendimento/parallax-clean`
(hero parallax, text reveal, card stack sticky, footer reveal) — reskinada com o design system do NOW.

## Conteúdo / seções

Hero (Viva o Agora) → manifesto → stats de Itajaí → localização (Rua Franklin Máximo Pereira 319) →
diferenciais (Loft Plus, Housi, tecnologia, R.Gubert) → lazer 25+ áreas → plantas (38–120 m²) →
personas (6) → construtora/Housi → conversão (form + WhatsApp) → footer.

## Pendências antes de publicar

1. **tracking.config.js** — preencher `account_id`, `ingest_url` (n8n), pixels do cliente e número de WhatsApp (placeholders `REPLACE_*`).
2. Integrar o **tracking-kit** real (decisão aberta #5: cópia vs submódulo) no lugar do stub.
3. Hospedar na **Cloudflare Pages** (ver `planning/08-empreendimentos-e-lp.md`).
4. Logo oficial NOW em SVG (hoje é aproximação tipográfica).

## Rodar localmente

```bash
cd landing-pages/now-residence && python3 -m http.server 8080
# abrir http://localhost:8080
```

# ADR 0006 — Nós criamos a LP; cliente só opera o CRM

**Status:** ✅ fechado

## Contexto
Modelo de captação: o cliente capta os próprios leads, ou nós entregamos a operação pronta?

## Decisão
**Nós criamos a Landing Page** de cada empreendimento (parte do produto), já conectada ao tracking. O **cliente só opera o CRM** — recebe lead pronto no funil e trabalha com o time. O cliente (ou nós, conforme pacote) **anuncia**.

## Consequências
- A **LP entra no template do empreendimento** (LP + personas + tracking + funil). Clona e troca conteúdo.
- **Duas marcas** separadas:
  - LP = marca do empreendimento/construtora (para o público).
  - CRM = marca da imobiliária/cliente (white-label, para o time).
- **Ordem do onboarding:** precisamos das credenciais de tracking do cliente **antes** de publicar a LP (ela dispara para os pixels dele).
- O cliente compra **resultado** (leads no CRM), não uma ferramenta para configurar. Menos fricção, mais valor.

## Aberto (relacionado)
Quem anuncia (cliente ou nós) é decisão **comercial** — ver `00-decisoes-abertas.md` #3. Não afeta a arquitetura.

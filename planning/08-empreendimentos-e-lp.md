# 08 — Empreendimentos e Landing Pages

## Conceito: arquitetura de referência replicável

Todo empreendimento segue **a mesma estrutura**. Abrir um novo = preencher um **template**, não construir do zero. O objetivo do Acram: "criar um case que depois a gente replica com outros empreendimentos".

## O que é um empreendimento

A unidade que **une marketing e vendas**. Cada empreendimento tem:

| Peça | Exemplo (Now Residence) |
|---|---|
| `slug` | `now-residence` (único por conta) |
| Personas / ICP | as 6 personas (investidor pré-lançamento, médico residente, universitário Univale, terceira idade, casal novo, comércio exterior/porto) |
| Landing Page | criada por nós, com tracking carimbando account+slug |
| Pixels / canais | herdados da conta (Meta/Google do cliente) |
| Funil | etapas padrão topo/meio/fundo |
| Conteúdo | fotos, plantas, catálogo, vídeo |

Conteúdo vive em `projetos-empreendimento/<slug>/` (já existe `now-residence-remax/`).

## Landing Page

- **Nós criamos** (parte do produto, não algo que o cliente monta).
- Carrega a **marca do empreendimento/construtora** (Now Residence, GBER) — não a marca do CRM.
- Embarca o `tracking-kit`; a config carimba `account_id` + `slug`.
- Preset recomendado para imobiliário: **lead-gen-hibrido** (form + WhatsApp).
- Hospedada na Cloudflare Pages.

### Duas marcas, não confundir
- **LP** = marca do empreendimento, para o público (lead).
- **CRM** = marca da imobiliária (white-label), para o time operar.

## Template de empreendimento (o que o sistema clona)

Ao criar um empreendimento novo, vem pronto para preencher:
- bloco de personas/ICP (vazio para preencher);
- slug + config de tracking;
- funil padrão;
- cadência de follow-up (5–12 contatos);
- automação de descarte.

Trocam-se só os conteúdos. Ver a skill `skills/criar-empreendimento/`.

## Now Residence — o primeiro case

- Construtora: Gober (~100 anos, 4ª geração, capital próprio) — argumento de segurança para o investidor.
- Localização: Centro de Itajaí, perto de Univale, hospitais (Marieta/Unimed), Balsa, portos.
- Argumento-chave: valorização 14–20%/ano na região; 2º empreendimento de short-stay/compactos entregue.
- Renda familiar mínima ~R$15k; facilidade de até 100 parcelas (liberado pela construtora à REMAX).
- Material em `projetos-empreendimento/now-residence-remax/` (catálogo web + vídeo + transcrição das personas).

## Serving multi-tenant da LP (arquitetura)

> **Regra de ouro:** a LP de um empreendimento **nunca** é hardcodada no Worker do CRM.
> Servir LP é uma feature de plataforma, resolvida por **(conta, slug)** em runtime —
> nada de `now-residence`/`REMAX` no código. Se aparece o nome de um cliente no
> código de serving, está errado.

### URL alvo (decisão do Acram)
A LP fica **no caminho do domínio do CRM**, por conta:

```
crm.remaxsc.com.br/                -> CRM (app interno, autenticado)
crm.remaxsc.com.br/<slug>          -> LP pública daquele empreendimento
crm.<outra-imob>.com.br/<slug>     -> LP da OUTRA conta, mesmo código, zero hardcode
```

O **domínio resolve a conta** (white-label, Cloudflare for SaaS). O **slug resolve o
empreendimento** dentro da conta. Os dois explícitos — igual a todo o resto do sistema.

### Como o Worker decide (roteamento)
Um **Worker com código** (não "só assets") inspeciona cada request:

1. **Resolve a conta pelo `Host`** — lookup `hostname -> account_id` (config/Supabase, cacheado).
2. **Classifica o path:**
   - rota reservada do app (`/funil`, `/leads`, `/dashboard`, `/config`, `/integracoes`, `/empreendimentos`, `/hoje`, `/leads/:id`, e assets do build) → serve o **CRM SPA**;
   - qualquer outro 1º segmento → trata como **`<slug>`** e tenta servir a **LP** de `(account_id, slug)`;
   - slug inexistente para a conta → 404 público (não cai no CRM).
3. **Busca a LP** de `(account_id, slug)` no storage (ver abaixo) e responde, injetando a
   `tracking.config.js` correta (carimba `account_id` + `slug` daquela conta).

> ⚠️ **Risco a gerenciar:** CRM e LP dividem o mesmo host, então o espaço de `<slug>`
> e o de rotas do app **não podem colidir**. As rotas do app são uma allowlist
> reservada; nenhum empreendimento pode usar um slug que bata com elas
> (validar no `criar-empreendimento`).

### Onde a LP de cada `(conta, slug)` mora
- LPs **não** ficam no bundle do CRM. Ficam num **storage servível por chave**:
  `R2: {account_id}/{slug}/index.html` (+ assets), ou equivalente.
- Publicadas no **onboarding do empreendimento** (skill `criar-empreendimento`):
  o template é preenchido, a `tracking.config.js` é carimbada com a conta e o slug,
  e o conjunto sobe pro storage sob a chave da conta.
- Trocar/atualizar a LP = republicar a chave; **não** exige deploy do Worker.

### Estado atual (provisório)
- **CRM** no ar como Worker de assets: `crm-remax` → `crm.remaxsc.com.br`.
- **LP now-residence** no ar como **preview isolado**: Worker `lp-now-residence`
  (`lp-now-residence.acramrajab.workers.dev`) — só para visualização, **fora** do
  fluxo multi-tenant. Será descartado quando o serving por `(conta, slug)` existir.
- O serving multi-tenant acima ainda **não está construído** — é a próxima feature
  desta área. Encosta em `02-arquitetura.md` (white-label de domínio / Cloudflare for SaaS).

## Apresentação GBER

Há uma apresentação prevista para a construtora (GBER). A arquitetura deste repo + o case Now Residence são a base dela. (Status a confirmar com o Acram.)

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

## Apresentação GBER

Há uma apresentação prevista para a construtora (GBER). A arquitetura deste repo + o case Now Residence são a base dela. (Status a confirmar com o Acram.)

# landing-pages/

Templates de **Landing Page por empreendimento**. Nós criamos (ADR 0006) — o cliente não monta LP.

> 🚧 Placeholder. A primeira LP é a do **Now Residence**.

## Regras

- Uma LP por empreendimento, hospedada na **Cloudflare Pages**.
- Embarca o **tracking-kit**; a config **carimba `account_id` + `slug`** em cada evento.
- Preset recomendado: **lead-gen-hibrido** (form + WhatsApp).
- Carrega a **marca do empreendimento/construtora** (não a marca do CRM).
- Dispara para os **pixels do cliente** (credenciais da conta) — por isso precisamos delas antes de publicar.

## Estrutura sugerida

```
landing-pages/
├── _template/              # molde base (clonar p/ cada empreendimento)
│   ├── index.html
│   └── tracking.config.js  # account_id + slug + pixels da conta
└── now-residence/          # primeira LP
```

## Conteúdo do empreendimento

Personas, fotos, plantas e catálogo vivem em `projetos-empreendimento/<slug>/`, não aqui. A LP **consome** esse conteúdo.

## Ver também

- `planning/08-empreendimentos-e-lp.md`
- `tracking-kit/` (como embarcar e configurar)

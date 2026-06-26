# 01 — Visão e Modelo de Negócio

## O problema

A maioria dos CRMs imobiliários falha por dois motivos:

1. Vira um **banco de dados que o corretor odeia preencher** — burocracia em vez de venda.
2. Só cuida do **fundo do funil** (lead já quente), ignorando de onde o lead veio e o que ele quer.

E marketing + vendas vivem **separados**: a equipe de tráfego não sabe o que converte, o corretor não sabe de onde o lead veio.

## A tese

Unir **marketing e vendas no mesmo sistema**, com o **comportamento de navegação** acompanhando o lead desde a origem até o fechamento.

> Quando o lead cai no funil, o corretor já sabe: de qual anúncio veio, quais páginas visitou, quanto tempo passou, qual persona provável. O "olho no olho" vira uma conversa cirúrgica.

## Filosofia do funil (do Acram)

O corretor é eficaz quando **lida com gente**: prospecta, faz follow-up, se relaciona cara a cara. O CRM existe para **empurrar o próximo contato humano**, não para ser planilha.

- **Topo:** inbound, outbound e indicação, com **ICP/persona claro por empreendimento**.
- **Meio:** **5 a 12 contatos** de follow-up antes do descarte. Descarte aciona automação de **nutrição leve** (não spam), e o lead volta para o corretor se der sinal de vida.
- **Fundo:** chamada para a ação — café, reunião presencial (ideal) ou online. Conexão humana.

**Quanto mais simples, melhor.** Toda feature passa pelo filtro: _o corretor vai usar, ou vai fugir disso?_

## Produto: três em um

1. **Tracking / marketing** — banco de dados de todo o comportamento (via `tracking-kit`).
2. **Dashboard de marketing** — atribuição multi-touch, origem, performance por canal e persona, CAC.
3. **CRM de vendas** — funil, leads com dossiê, hub omnichannel (WhatsApp + e-mail), anotações, follow-up.

O que amarra os três: a **identidade do lead** (anônimo → pessoa) e o **isolamento por conta/empreendimento**.

## Modelo de negócio

- **Cliente 1:** a operação **REMAX** dos sócios. Serve para validar o case (começando pelo empreendimento **Now Residence**).
- **Depois:** vender a plataforma para **outras imobiliárias/corretores** (white-label).

### Como vendemos (escopo de serviço)

- **Nós criamos a Landing Page** de cada empreendimento, já conectada ao tracking.
- O **cliente só opera o CRM** — recebe lead pronto no funil e trabalha com o time dele.
- O cliente **anuncia** (ou nós, dependendo do pacote — decisão comercial em aberto).
- O cliente fornece as **credenciais de marketing dele** (pixel, Google Ads); o resto é motor da plataforma.

> O cliente compra **resultado** (leads no CRM), não uma ferramenta para configurar. Menos fricção de onboarding, mais valor percebido.

### Marca

`remax-crm` é nome de trabalho. O produto vendável tem **marca própria** (a definir). REMAX é uma franquia (marca de terceiro) e entra como o **primeiro cliente/conta**, nunca como nome de produto. O código não hardcoda "REMAX" em nada de produto — a marca é config por conta (white-label).

## Por que dá para fazer

A peça mais difícil — o **tracking com atribuição multi-touch e server-side** (`tracking-kit`) — já existe e roda em Supabase. O que falta é a **costura** (stitching anônimo→lead) e o **CRM em si**, ambos em cima de tecnologia que os sócios já têm (Supabase, n8n, Cloudflare).

## Riscos conscientes

- **WhatsApp via Evolution API** é não-oficial (risco de ban de número). Ver `decisions/`.
- **LGPD:** ao hospedar dados de leads de vários clientes, somos **operador** e o cliente é **controlador** — exige contrato de tratamento. Ver `09-onboarding-e-credenciais.md`.
- **Custo por uso** (Apify/Firecrawl/OpenRouter) escala com volume de leads — input para a precificação.
- **Escopo:** a visão é grande. Sequenciar. Validar Now Residence ponta a ponta antes de generalizar.

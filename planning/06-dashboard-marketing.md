# 06 — Dashboard de Marketing

## Para quem

- **Nós / account_admin:** inteligência de negócio — o que converte, quanto custa, qual persona fecha.
- O **corretor** não vive aqui; ele vive no CRM. O dashboard é a camada de marketing/gestão.

## Fonte de dados

A tabela `tracking_events` (log) + as views de atribuição do `tracking-kit`, sempre filtradas por `account_id` (RLS) e, opcionalmente, por `empreendimento_id`.

## Blocos do dashboard

### 1. Origem dos leads
De onde vêm os leads: canal, campanha, anúncio. Inbound / outbound / indicação. Por empreendimento.

### 2. Atribuição
- **First-touch:** qual canal *originou* (branding/topo).
- **Last-touch:** qual canal *fechou* (padrão Meta/Google).
- **Multi-touch (linear / time-decay):** crédito distribuído pela jornada.
Views: `v_atribuicao_first_touch`, `v_atribuicao_last_touch`, `v_atribuicao_linear`.

### 3. Funil de conversão
PageView → Lead → reunião → fechamento. Onde vaza. Por persona e por empreendimento.

### 4. Performance por persona
Quais das personas (ex.: as 6 do Now Residence) convertem mais, qual canal traz cada uma. Alimenta o **look-alike / Custom Audience** no Meta.

### 5. CAC e custo por canal/persona
Custo de aquisição. Input para a precificação do serviço.

## Inteligência de mercado (look-alike)

O Acram quer "buscar o público semelhante". Com `email_hash` / `fbp` / `fbc` capturados, dá para:
- alimentar **Custom Audience** e **Look-alike** no Meta;
- cruzar quem converte com dados de enriquecimento (Apify/Firecrawl) para refinar o ICP.

## Implementação sugerida

- Charts: Chart.js (leve, roda no Cloudflare Pages).
- Queries agregadas via views no Supabase (não puxar evento cru para o browser).
- Filtro global: conta (via RLS) + empreendimento + período.

## Importante

O dashboard **lê** o log; ele não é o CRM. Mantê-lo separado da tela do corretor — públicos e propósitos diferentes.

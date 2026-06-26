# 05 — CRM (Funil, Leads, Omnichannel, Distribuição, Papéis)

## Princípio

O CRM **empurra o próximo contato humano**. Não é planilha. Cada tela responde "o que o corretor faz agora com esse lead?".

## Funil

Filosofia topo/meio/fundo (do Acram), materializada em **etapas configuráveis por conta**:

- **Topo:** lead novo (inbound / outbound / indicação), com **persona/ICP** estimada por empreendimento.
- **Meio:** follow-up. Regra dos **5 a 12 contatos** antes do descarte. O sistema empurra o próximo follow-up (tarefa com data) — "ligar pro João, é o 4º contato".
- **Fundo:** CTA para encontro presencial (ideal) / online.

Etapas default vêm prontas; o admin pode renomear/reordenar. `funnel_stages` por conta (ou por empreendimento, se necessário).

### Descarte e nutrição
Descartar um lead aciona automação de **nutrição leve** (não spam) via n8n. Se o lead dá sinal de vida (abre email, responde WhatsApp), **volta** para o corretor. Cuidado para não automatizar a ponto de matar a conexão humana — a automação é rede de segurança, não substituto.

## Tela do lead (o coração)

Tudo num lugar só, o corretor **não sai** da plataforma:

1. **Dossiê** (gerado por IA na entrada) — quem é, persona provável, ângulo de abordagem. Ver `07-dossie-ia.md`.
2. **Jornada de navegação** — de onde veio, o que visitou (do tracking). Não os 400 PageViews crus; o resumo acionável.
3. **Hub omnichannel** — conversa de WhatsApp + e-mail no mesmo histórico.
4. **Anotações** — livres, do corretor.
5. **Tarefas / follow-up** — próximos contatos agendados, com a contagem da regra 5–12.
6. **Atividades** — histórico (mudou de etapa, contato feito, dossiê gerado).

## Hub omnichannel

### WhatsApp (Evolution API)
- O corretor **conecta o WhatsApp por QR** (tela de conexão) — número dele vira uma instância na Evolution.
- Conversa **dentro da plataforma**: mensagem que chega → webhook Evolution → n8n → grava em `messages` → aparece no lead. Mensagem que sai → CRM → n8n → Evolution → WhatsApp.
- Uma instância da Evolution hospeda **vários números** (escala entre corretores/contas).
- ⚠️ Não-oficial: risco de ban. Camada de mensagens **agnóstica** para poder migrar ao oficial sem reescrever o CRM. Ver `decisions/`.

### E-mail
- Enviar pela plataforma (MailerSend / Resend / SES).
- **Receber** (inbound) a resposta no mesmo thread do lead — senão a resposta cai na caixa pessoal do corretor e some do CRM. Inbound exige webhook/parse do provedor.

### Camada agnóstica
O CRM fala com um "provedor de mensagens" abstrato (`whatsapp` / `email`). Trocar Evolution → API oficial, ou trocar provedor de e-mail, não deve tocar a UI.

## Distribuição de leads

**Configurável por conta** — cada imobiliária trabalha diferente, então o **dono configura a regra** (não hardcoded).

- Regras possíveis: rodízio (round-robin), por região, por persona/empreendimento, pool aberto (corretor puxa).
- Executada no **n8n** quando o lead entra.
- **Default ligado** (rodízio simples) para a conta nova funcionar no primeiro dia — senão lead novo fica sem dono.
- Admin pode **reatribuir** manualmente.

## Papéis e visibilidade

| Papel | Vê |
|---|---|
| `super_admin` (nós) | todas as contas |
| `account_admin` (dono da imobiliária) | todos os leads/dados da conta |
| `broker` (corretor) | **os próprios leads** (default) |

- Default: corretor vê só os dele. Configurável por conta para "visão de equipe" se a imobiliária quiser.
- Reforçado por **RLS** (`account_id`) + policy de `owner_id` em `leads`.

## Aba Empreendimentos

Uma conta tem **vários empreendimentos**. A aba lista os empreendimentos da conta; cada um tem seu slug, personas, LP e recorte de funil. O funil/dashboard pode ser **filtrado por empreendimento** (leads do Now Residence separados dos do próximo lançamento).

## O que NÃO fazer

- Não encher de campos obrigatórios que o corretor odeia preencher.
- Não esconder o "próximo contato" atrás de menus.
- Não deixar a automação falar pelo corretor no fundo do funil — ali é humano.

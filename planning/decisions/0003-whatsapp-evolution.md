# ADR 0003 — WhatsApp via Evolution API (camada agnóstica)

**Status:** ✅ fechado (risco monitorado)

## Contexto
No imobiliário brasileiro, o lead vive no WhatsApp. O CRM precisa que o corretor **converse dentro da plataforma** sem sair. A UX desejada: o corretor **conecta o WhatsApp por QR** (número pessoal) e conversa ali mesmo.

Dois caminhos:
- **Oficial (Meta WhatsApp Cloud API):** escala, sem ban. Mas exige número business registrado, verificação, e templates aprovados para mensagens fora da janela de 24h. Não funciona por QR de número pessoal.
- **Não-oficial (Evolution API, Z-API...):** exatamente a UX por QR com número pessoal. Barato, popular. **Contra os termos da Meta → risco de ban.**

## Decisão
Usar **Evolution API** (self-hosted, Docker). Entrega a experiência desejada.
**Mitigação obrigatória:** a camada de mensagens do CRM é **agnóstica** — fala com um "provedor de WhatsApp" abstrato. Trocar para a API oficial depois **não** deve tocar a UI.

## Consequências
- Corretor conecta número por QR; uma instância da Evolution hospeda vários números.
- Integração via webhook ↔ n8n ↔ Supabase (`conversations`/`messages`).
- Precisa de um servidor para a Evolution (ao lado do n8n).
- **Risco:** ban de número. Revisitar para o oficial quando volume/risco justificar.

## Relacionado
- Decisão aberta #4 em `00-decisoes-abertas.md` (revisão futura oficial vs não-oficial).
- `05-crm.md` (hub omnichannel).

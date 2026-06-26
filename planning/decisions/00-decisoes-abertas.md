# Decisões abertas (pendentes)

> Itens que **ainda não estão fechados**. Não bloqueiam o scaffold, mas precisam ser decididos antes de codar a parte afetada. A maioria é para bater com o **Acram**.

---

## 🔴 1. Por onde começar a construir
**Status:** aberto (Acram).
**Opções:**
- (A) **Now Residence ponta a ponta** sobre fundação multi-tenant — prova viva + base da apresentação GBER. _(recomendado)_
- (B) Plataforma genérica multi-tenant completa antes de plugar o primeiro empreendimento.

**Recomendação:** (A), construído já em cima da base multi-tenant mínima. Algo real no ar rápido, sem dívida técnica.
**Afeta:** ordem do roadmap (`10-roadmap.md`).

---

## 🔴 2. Regra de identidade do lead
**Status:** aberto (Acram + técnica).
**Pergunta:** o que faz dois eventos serem "a mesma pessoa"? E se converte em dois devices?
**Default proposto:**
1. casar por `email_hash`; senão `phone_hash`;
2. mesmo email com dois `visitor_id` → mesclar num lead, acumulando visitor_ids;
3. botão de **merge/split manual** no CRM.

**Afeta:** stitching (`04-tracking-e-stitching.md`), tabela `leads` (`03-modelo-de-dados.md`). Define se o corretor vê dossiê unificado ou leads duplicados.

---

## 🟡 3. Anúncio: cliente ou nós
**Status:** aberto (comercial).
**Pergunta:** vendemos só plataforma+LP, ou também gestão de tráfego?
**Não afeta a arquitetura** — afeta o que se cobra. Decidir com o Acram, mas pode ser depois.

---

## 🟡 4. WhatsApp: oficial vs não-oficial
**Status:** **decidido por ora** → Evolution API (não-oficial). Ver ADR 0003.
**Risco aberto:** ban de número. Mitigação: camada de mensagens **agnóstica** para migrar ao oficial sem reescrever. Revisitar quando volume/risco justificar.

---

## 🟡 5. tracking-kit: cópia vs submódulo
**Status:** aberto (técnica, baixo impacto).
**Opções:** copiar (vendoring, mais fácil evoluir p/ V2) vs git submodule (sincroniza com o repo original).
**Recomendação:** decidir na hora de integrar. Não trava nada.

---

## Decisões já fechadas → viraram ADRs em `decisions/`
- Multi-tenant pooled com RLS → ADR 0001
- Slug único por conta + dois campos (account_id + slug) → ADR 0002
- WhatsApp via Evolution API (agnóstico) → ADR 0003
- Stack Cloudflare + Supabase + n8n → ADR 0004
- Dossiê gerado na entrada do lead no CRM → ADR 0005
- Nós criamos a LP / cliente só opera o CRM → ADR 0006

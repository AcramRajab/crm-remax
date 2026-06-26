---
name: criar-empreendimento
description: Cria um empreendimento novo seguindo a arquitetura de referência — slug, personas/ICP, funil, conteúdo e landing page conectada ao tracking. Use ao adicionar um lançamento imobiliário a uma conta existente.
---

# Criar Empreendimento

Cria um empreendimento novo **seguindo sempre a mesma arquitetura** (o "case replicável" do Acram). Trocam-se só os conteúdos; a estrutura é idêntica.

## Pré-requisitos
- A **conta** (imobiliária) já existe. Se não, rode `onboarding-cliente` antes.
- Credenciais de tracking da conta já cadastradas (pixels do cliente).

## Passo a passo

### 1. Definir identidade
- `slug` — único **por conta** (ex.: `now-residence`). Confirme que não colide dentro da conta.
- `name`, `construtora`.

### 2. Personas / ICP
Levantar as personas do empreendimento (o ICP do topo de funil). Ex.: as 6 do Now Residence (investidor pré-lançamento, médico residente, universitário, terceira idade, casal novo, comércio exterior/porto). Guardar em `empreendimentos.personas` (jsonb).

### 3. Conteúdo
Criar `projetos-empreendimento/<slug>/` com fotos, plantas, catálogo, vídeo, transcrição de personas.

### 4. Registro no banco
Inserir em `empreendimentos` (account_id + slug + name + personas + details). Respeitar `unique (account_id, slug)`.

### 5. Funil
Aplicar as etapas default (topo/meio/fundo) para a conta, se ainda não existirem (`funnel_stages`).

### 6. Landing Page
Clonar `landing-pages/_template/` para `landing-pages/<slug>/`. Configurar `tracking.config.js`:
- carimbar `account_id` + `slug`;
- preset `lead-gen-hibrido`;
- pixels da conta.
Aplicar a **marca do empreendimento** (não a do CRM).

### 7. Tracking / n8n
Garantir que o n8n reconhece a origem da LP e carimba a conta correta (anti-spoof).

### 8. Validar
- Evento de teste cai em `tracking_events` com `account_id` + slug certos.
- Conversão de teste gera lead via stitching, com dossiê.

## Referências
- `planning/08-empreendimentos-e-lp.md`
- `planning/04-tracking-e-stitching.md`
- `supabase/migrations/03-empreendimentos.sql`

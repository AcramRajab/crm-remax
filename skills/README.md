# skills/

Skills do agente para **operar** a plataforma — fluxos repetíveis que o Claude Code (ou Cowork) executa.

| Skill | O que faz |
|---|---|
| `criar-empreendimento/` | Cria um empreendimento novo seguindo o template de referência (slug, personas, funil, LP, tracking). |
| `onboarding-cliente/` | Cadastra uma conta/imobiliária nova (white-label, credenciais, primeiro empreendimento). |

> Skills aqui são **operacionais do produto**, diferentes das skills de desenvolvimento. Cada uma tem um `SKILL.md` com o passo a passo.

## Padrão

Cada skill segue o formato:
- `SKILL.md` com frontmatter (`name`, `description`) e instruções claras.
- Referências a `planning/` para o contexto, e aos SQL/workflows que toca.

# MASTER PRD — SistemOS

> **Documento Fonte de Verdade (Single Source of Truth)**
> Este documento centraliza a visão, escopo, regras e decisões técnicas e de produto do SistemOS.

---

## 1. Visão do Produto

O **SistemOS** é uma aplicação web pessoal projetada para centralizar a gestão acadêmica e otimizar o planejamento de estudos de um único usuário. O objetivo é fornecer visibilidade completa sobre o desempenho acadêmico, controle de frequência e prazos, cálculo e simulação de médias, monitoramento de risco e recomendações inteligentes de estudo ao longo da graduação.

---

## 2. Escopo

### 2.1 No Escopo (In-Scope)
- Gestão centralizada da vida acadêmica do usuário.
- Aplicação single-user (foco total na experiência individual, sem complexidade de multi-inquilino).
- Operação em ambiente web (desktop/mobile-friendly).

### 2.2 Fora de Escopo (Out-of-Scope)
- Arquitetura SaaS / Multi-tenant.
- Autenticação com múltiplos papéis, organizações e permissões complexas.
- Processamento de pagamentos ou planos de assinatura.
- Redes sociais acadêmicas ou compartilhamento colaborativo complexo.

---

## 3. Funcionalidades

O sistema contemplará os seguintes módulos e capacidades:

- **Gestão de Semestres e Disciplinas:** Cadastro de períodos letivos, matérias cursadas, créditos/carga horária e professores.
- **Grade de Horários e Calendário:** Organização de horários de aula semanais e calendário de eventos acadêmicos.
- **Frequência e Controle de Faltas:** Registro de presenças/faltas e cálculo de limites antes de reprovação.
- **Avaliações e Notas:** Gestão de provas (P1, P2, substitutivas, exames finais), trabalhos e pesos.
- **Cálculo e Simulação de Médias:** Cálculo automático de médias parciais/finais e simulador de nota necessária para aprovação.
- **Conteúdos e Ementas:** Acompanhamento de tópicos lecionados e pendências de leitura/revisão.
- **Tarefas e Entregas:** Lista de afazeres, prazos e controle de status de trabalhos acadêmicos.
- **Sessões de Estudo e Planejamento Semanal:** Registro de tempo dedicado a cada matéria e metas de estudo semanais.
- **Risco Acadêmico:** Indicadores de disciplinas críticas baseados em notas e limite de faltas.
- **Recomendação de Estudo:** Sugestões prioritárias do que estudar com base em prazos, peso e desempenho.
- **Progresso da Graduação:** Visão global da evolução do curso (disciplinas concluídas, pendentes e médias gerais).

---

## 4. Mapa de Telas

*(Esqueleto inicial a ser detalhado na etapa de UI/UX)*

- **Dashboard Principal:** Visão geral do semestre atual, alertas de risco, próximas entregas/aulas e progresso da semana.
- **Disciplinas & Semestres:** Detalhes de cada matéria (notas, faltas, ementa, cronograma).
- **Simulador de Médias & Notas:** Interface dedicada a projeções de notas necessárias.
- **Planejamento & Calendário:** Grade semanal de horários e calendário mensal com entregas e provas.
- **Tarefas & Sessões de Estudo:** Gestão de to-dos acadêmicos e timer/registro de estudo.
- **Progresso do Curso:** Painel geral da grade curricular e evolução da graduação.

---

## 5. Modelo de Dados

*(Estrutura conceitual a ser formalizada após definição da stack e persistência)*

Entidades principais previstas:
- `Semester` (Semestre letivo)
- `Subject` (Disciplina / Matéria)
- `ScheduleSlot` (Horário de aula)
- `AttendanceRecord` (Registro de presença/falta)
- `Assessment` (Avaliação / Prova / Trabalho)
- `Topic` (Conteúdo / Tópico da ementa)
- `Task` (Tarefa / Entrega)
- `StudySession` (Sessão de estudo realizada)
- `CourseProgress` (Parâmetros curriculares e histórico global)

---

## 6. Regras de Negócio

*(Serão detalhadas conforme as fórmulas e critérios do curso do usuário forem fornecidos)*

- **Frequência Mínima:** Regra padrão de tolerância de faltas por carga horária.
- **Fórmulas de Médias:** Cálculo ponderado/aritmético de notas e critérios para exame/recuperação.
- **Critérios de Risco:** Definição de gatilhos de alerta (ex.: média atual abaixo da meta ou >70% do limite de faltas atingido).

---

## 7. UX/UI

- **Diretriz Geral:** Interface limpa, moderna, focada em produtividade rápida e visualização clara de prioridades.
- **Tema:** Suporte a tema escuro/claro com alta legibilidade.
- **Acessibilidade & Responsividade:** Layout adaptável para uso tanto em desktop quanto em dispositivos móveis.

---

## 8. Arquitetura

### 8.1 Stack Tecnológica
- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Banco de Dados:** PostgreSQL (hospedado via Supabase)
- **ORM:** Drizzle ORM (com migrations versionadas)
- **Validação de Schemas:** Zod
- **Testes Unitários/Integração:** Vitest
- **Estratégia de Deploy:** Vercel ou VPS / Coolify

### 8.2 Diretrizes Arquiteturais
- **Monólito Modular:** Aplicação web monolítica sem backend desacoplado, aproveitando o App Router do Next.js (Server Components, Server Actions e Route Handlers quando necessário).
- **Separação de Camadas & Domínio Puro:** As regras de negócio acadêmicas (cálculo de médias, simulações, controle de faltas, matriz de risco e priorização de estudos) devem residir estritamente em módulos/serviços de domínio isolados e desacoplados dos componentes de UI.
- **Testabilidade:** Serviços de cálculo e regras de domínio devem ter cobertura de testes automatizados com Vitest.
- **Persistência Relacional:** Modelagem relacional estrita com versionamento explícito de migrations via Drizzle Kit.
- **Simplicidade & Pragmatismo:** Sem Redis, mensageria/filas, microsserviços ou n8n na fase atual.
- **Escopo de Inteligência Artificial:** Recursos de IA estão explicitamente fora do MVP.

---

## 9. Roadmap

- [x] **Etapa 1:** Estruturação inicial do repositório e elaboração do esqueleto do MASTER_PRD.
- [x] **Etapa 2:** Definição da arquitetura técnica e stack tecnológica.
- [x] **Etapa 3:** Inicialização do projeto Next.js (TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Zod, Vitest) e estrutura de pastas modular.
- [x] **Etapa 4:** Modelagem de dados detalhada no Drizzle (schemas e migrations) e formalização das regras de negócio.
- [x] **Etapa 5:** Implementação dos serviços de domínio (cálculo de médias, faltas, risco e recomendação) com testes unitários no Vitest.
- [ ] **Etapa 6:** Construção das interfaces e componentes UI com shadcn/ui.
- [ ] **Etapa 7:** Integração ponta a ponta e preparação para deploy (Vercel ou Coolify).

---

## 10. Decisões Tomadas

| Data | Decisão | Contexto / Motivo |
|---|---|---|
| 2026-08-19 | Foco exclusivo em Single-User | Eliminar overhead de sistemas SaaS, multi-inquilino, auth complexa e pagamentos, focando 100% na utilidade pessoal do usuário. |
| 2026-08-19 | Centralização documental no `MASTER_PRD.md` | Manter uma fonte única de verdade estruturada para guiar todas as decisões de produto e engenharia sem fragmentação. |
| 2026-08-19 | Stack: Next.js + TS + Tailwind + shadcn/ui + Drizzle + Supabase PG | Monólito web com App Router, tipagem estrita de ponta a ponta, design system consistente e ORM leve/type-safe. |
| 2026-08-19 | Isolamento de Regras de Negócio e Testes com Vitest | Manter lógica acadêmica (médias, faltas, risco) desacoplada da UI em serviços de domínio 100% testáveis. |
| 2026-08-19 | Exclusão de IA e Infraestrutura Complexa no MVP | Manter simplicidade operacional sem Redis, filas, automações externas (n8n) ou IA na primeira versão funcional. |
| 2026-08-19 | GitHub `SistemOS` como repositório oficial | Versionamento centralizado no GitHub. |
| 2026-08-19 | Supabase `SistemOS` (ref: `eeneljkwnpmnixlmdccp`, org: Triyo Teste) | Supabase fornece o PostgreSQL hospedado; Drizzle ORM é a fonte de definição do schema via migrations versionadas. |
| 2026-08-19 | Média ponderada genérica como regra padrão | `Σ(nota × peso) / Σ(pesos)`. Preset P1/P2 peso 1/1 produz média simples; pesos configuráveis por disciplina. |
| 2026-08-19 | Frequência baseada em unidades de ausência | `absenceUnits` por sessão permite representar aulas duplas/triplas. Aulas canceladas excluídas do cálculo. Percentual mínimo configurável (default 75%). |
| 2026-08-19 | Valores derivados não são persistidos no banco | `currentAverage`, `attendancePercentage`, `remainingAbsences` e `riskScore` são sempre calculados em tempo de leitura pelos serviços de domínio. |
| 2026-08-19 | Fórmula pós-exame não definida | Exame modelado e detectável (`EXAM_REQUIRED`), mas cálculo final pós-exame aguarda definição das regras institucionais. |

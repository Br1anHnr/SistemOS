# SistemOS

Aplicação web pessoal para gestão acadêmica e planejamento de estudos.

**Estado:** funciona localmente e continua em desenvolvimento. Ainda não é uma aplicação finalizada; não há resultados de uso por terceiros apresentados aqui.

## Problema e proposta

Reduzir a dispersão das informações acadêmicas, reunindo planejamento e acompanhamento dos estudos em uma aplicação pessoal. A lista de objetivos abaixo descreve o escopo do produto e não certifica que todas as jornadas estejam concluídas.

## Demonstração a preparar

Com dados fictícios, mostrar cadastro de disciplina, registro de avaliação e acompanhamento da média. Identificar as etapas que já funcionam e as que dependem de desenvolvimento. Uma gravação local permite demonstrar o estado atual, sem anunciar disponibilidade pública.

## Objetivo
Centralizar a vida acadêmica de um único usuário: controle de semestres, disciplinas, horários, faltas/frequência, avaliações, notas e médias, tarefas, sessões de estudo, calendário, cálculo de risco acadêmico e progresso da graduação.

## Stack
- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript (estrito)
- **Estilização & UI:** Tailwind CSS + shadcn/ui
- **Banco de Dados & ORM:** PostgreSQL (Supabase) + Drizzle ORM
- **Validação:** Zod
- **Testes:** Vitest

## Como executar localmente

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e preencha a URL de conexão do PostgreSQL:
```bash
cp .env.example .env.local
```

### 3. Scripts disponíveis
```bash
# Desenvolvimento local
npm run dev

# Verificação de tipos TypeScript
npm run typecheck

# Linting
npm run lint

# Execução de testes unitários
npm run test

# Build de produção
npm run build
```

## Documentação
A especificação funcional, modelo de dados, regras de negócio e roadmap do projeto estão centralizados em:
- [docs/MASTER_PRD.md](docs/MASTER_PRD.md)

## Próximos passos para o portfólio

- [ ] Conferir e documentar quais jornadas estão concluídas.
- [ ] Adicionar capturas com dados fictícios e uma demonstração curta.
- [ ] Validar a configuração em uma instalação nova.
- [ ] Registrar os resultados dos testes com data e ambiente.

Os comandos acima são os scripts do projeto; não foram executados nesta revisão documental. Não há funcionalidade de LLM demonstrada neste README. Uso de IA como apoio ao desenvolvimento deve ser descrito separadamente, com exemplos reais do processo.

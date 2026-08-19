# SistemOS

Aplicação web pessoal para gestão acadêmica e planejamento de estudos.

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

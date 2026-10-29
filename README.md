# SistemOS

Estou construindo o SistemOS para organizar meus estudos e acompanhar a vida acadêmica em uma aplicação pessoal. Ele já funciona localmente, mas ainda estou concluindo o desenvolvimento.

## Por que comecei

Queria reunir informações que ficam espalhadas entre horários, avaliações, tarefas e planejamento de estudos. Meu objetivo é centralizar esse acompanhamento e facilitar a organização da rotina.

## Escopo que estou desenvolvendo

Controle de semestres, disciplinas, horários, faltas e frequência, avaliações, notas e médias, tarefas, sessões de estudo, calendário, risco acadêmico e progresso da graduação.

Essa é a visão do produto. Ainda estou concluindo e validando as jornadas, então nem tudo está pronto.

## Tecnologias

- Next.js com App Router e TypeScript.
- Tailwind CSS e shadcn/ui.
- PostgreSQL, com Supabase e Drizzle ORM.
- Zod para validação.
- Vitest para testes.

## Como executar localmente

Instale as dependências:

```sh
npm install
```

Copie o arquivo de exemplo e configure a conexão com seu PostgreSQL:

```sh
cp .env.example .env.local
```

Inicie o desenvolvimento:

```sh
npm run dev
```

Comandos de verificação e build:

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

## Documentação

Mantenho a especificação funcional, o modelo de dados, as regras de negócio e o roadmap em [docs/MASTER_PRD.md](docs/MASTER_PRD.md).

## Meus próximos passos

- [ ] Concluir e documentar as jornadas principais.
- [ ] Gravar uma demonstração local com dados fictícios, mostrando uma disciplina, suas avaliações e o acompanhamento da média.
- [ ] Adicionar capturas das telas.
- [ ] Validar a configuração em uma instalação nova.
- [ ] Registrar os resultados dos testes com data e ambiente.

Ainda não disponibilizei uma versão pública para uso de outras pessoas.

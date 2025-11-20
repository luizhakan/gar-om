# Testes de Integração

Este diretório contém testes de integração que usam um banco de dados PostgreSQL real para validar comportamentos que dependem de constraints do banco, como foreign keys.

## Setup

1. Iniciar o container do banco de testes:
```bash
docker compose up -d db-test
```

2. Rodar migrations no banco de teste:
```bash
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public" npx prisma migrate deploy
```

Ou use o script:
```bash
cd backend
./test/integration/setup-db.sh
```

## Rodar testes

```bash
# Apenas testes unitários (com mocks)
npm run test:unit

# Apenas testes de integração (com banco real)
npm run test:integration

# Todos os testes
npm test
```

## Diferença entre testes unitários e de integração

- **Testes unitários** (`test/*.spec.ts`): Usam mocks do Prisma, não validam constraints do banco
- **Testes de integração** (`test/integration/*.spec.ts`): Usam banco real na porta 5433, pegam erros de foreign key, unique constraints, etc.

## Containers

- **garcom-db** (porta 5432): Banco de desenvolvimento/produção
- **garcom-db-test** (porta 5433): Banco de testes (usa tmpfs, dados não são persistidos)

# Backend (NestJS + Prisma)

API REST em NestJS que serve o app Garçom (Admin, Cozinha e Cliente). Toda a comunicação com o banco é feita via Prisma e as rotas expõem validação com `class-validator`.

## Rodando localmente
1. `cd backend`
2. `npm install`
3. Copie `.env.example` para `.env` (aponta para o Postgres do docker-compose)
4. `npm run prisma:generate`
5. `npm run prisma:migrate`
6. `npm run prisma:seed`
7. `npm run start:dev` (http://localhost:3001)

## Testes

### Testes unitários (com mocks)
```bash
npm run test:unit
```
Usam mocks do Prisma, não validam constraints do banco.

### Testes de integração (com banco real)
```bash
# Iniciar container do banco de testes
docker-compose up -d db-test

# Rodar migrations
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public" npx prisma migrate deploy

# Rodar testes
npm run test:integration
```
Usam banco PostgreSQL real (porta 5433), pegam erros de foreign key, unique constraints, etc.

### Todos os testes
```bash
npm test
```

Veja mais detalhes em `test/integration/README.md`.

## Stack e padrões
- NestJS 11 com DTOs validados (ValidationPipe global)
- Prisma Client (Postgres) com serviço global para injeção
- `class-validator` + `class-transformer` em todos os DTOs
- Testes unitários em Jest + ts-jest (mockando Prisma)
- Testes de integração com banco PostgreSQL real
- Código, docs e mensagens em PT-BR

## Mapa rápido de pastas
```
src/
├── auth/        # Cadastro/login de Admin e Cozinha
├── categorias/  # CRUD simples de Categorias
├── mesas/       # Configuração/listagem de mesas por restaurante
├── pedidos/     # Fluxo de pedidos e mudança de status
├── produtos/    # CRUD de produtos + toggle de disponibilidade
└── prisma/      # Módulo global do Prisma (injeção do client)

prisma/
├── schema.prisma     # Modelo do domínio
└── migrations/       # Histórico de migrações

test/
├── *.spec.ts         # Testes unitários (com mocks)
└── integration/      # Testes de integração (banco real)
```

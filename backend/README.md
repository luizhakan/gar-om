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
8. `npm test` para rodar os testes unitários com mocks do Prisma

## Stack e padrões
- NestJS 11 com DTOs validados (ValidationPipe global)
- Prisma Client (Postgres) com serviço global para injeção
- `class-validator` + `class-transformer` em todos os DTOs
- Testes em Jest + ts-jest (mockando Prisma; nada de I/O real nos testes)
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
```

# Prisma (Schema, Migrações e Seed)

Modela o domínio do app (Restaurantes, Admins, Categorias, Produtos, Mesas, Pedidos e Itens). Usa Postgres via variável `DATABASE_URL` definida em `.env`.

## Fluxo comum
1. `npm run prisma:generate` – gera o Prisma Client.
2. `npm run prisma:migrate` – aplica migrações para o banco configurado.
3. `npm run prisma:seed` – popula dados de exemplo (cardápio, mesas, pedido demo).

## Dicas
- Edite `schema.prisma` e gere nova migration com `npm run prisma:migrate -- --name <nome>`.
- Seeds e scripts de manutenção vivem dentro desta pasta (`seed.ts` etc.).
- Os testes unitários não acessam o banco real; qualquer mock do Prisma fica em `test/`.

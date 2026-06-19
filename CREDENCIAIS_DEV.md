# 🔑 Credenciais de Desenvolvimento

> Contas criadas pelo seed (`backend/prisma/seed.ts`) para ambiente local. **Não usar em produção.**

| Tipo | Acesso | Login | Senha |
|---|---|---|---|
| 🛡️ **Master** | `http://localhost:5173/master` | `founder@garcom.com` | `senha123` |
| 🍽️ **Admin** | `http://localhost:5173/admin` | `admin@demo.com` | `admin456` |
| 👨‍🍳 **Cozinha** | `http://localhost:5173/cozinha` | `garcom-agil` | `admin456` |

## Observações

- O **admin** já vem com o **Restaurante Demo** (trial de 14 dias), 4 categorias, 11 produtos, 10 mesas e 1 pedido de demonstração.
- O **master** gerencia todos os restaurantes em `/master`.
- As senhas estão definidas em `backend/prisma/seed.ts`. Rodar `npm run prisma:seed` **apaga todos os dados** antes de recriá-los.

## Como subir o ambiente

```bash
# 1) Banco (único serviço no Docker)
docker compose up -d db          # Postgres em localhost:54321

# 2) Backend
cd backend && npm run start:dev  # API em localhost:3001

# 3) Frontend
cd frontend && npm run dev       # App em localhost:5173
```

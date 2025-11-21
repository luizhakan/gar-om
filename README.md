# Garçom Ágil – Monorepo (Frontend + Backend)

Este repositório agora está organizado em duas pastas:

- `frontend/`: app React + Vite (cardápio, cozinha e admin).
- `backend/`: API NestJS com Prisma (PostgreSQL).

## Como rodar

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (abre em http://localhost:5173)

### Backend
1. `docker compose up -d db` (sobe Postgres em `localhost:5432`, user/senha `admin`)
2. `cd backend`
3. `npm install`
4. Copie `.env.example` para `.env` (já aponta para o Postgres do compose)
5. `npm run prisma:generate`
6. `npm run prisma:migrate` (cria tabelas no Postgres)
7. `npm run prisma:seed` (dados de exemplo: cardápio, mesas, pedido demo)
8. `npm run start:dev` (API em http://localhost:3001)

### Stack Docker completa (db + backend + frontend + nginx + certbot)
1. Ajuste `AUTH_SECRET` e domínio/email no `docker-compose.yml` (garcomagil.com está configurado como padrão).
2. Gere o certificado inicialmente (DNS do domínio deve apontar para o host):
   ```bash
   docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
     -d garcomagil.com --email seu-email@dominio.com --agree-tos --no-eff-email
   ```
   Depois disso, reinicie o nginx: `docker compose restart nginx`
3. Suba tudo: `docker compose up -d`
   - Frontend: `frontend` (porta interna 80)
   - Backend: `backend` (porta 3001)
   - Banco: `db` (porta 5432)
   - Nginx: expõe 80/443 para o domínio e faz proxy para frontend/backend
   - Certbot: roda renovação a cada 12h
4. Se quiser usar sem HTTPS, suba apenas nginx + app e pule o passso do certbot (ou crie um cert self-signed nos volumes).

### Testes

#### Rodar todos os testes (unitários + integração)
```bash
# Da raiz do projeto
./test.sh
```
Este script:
- Inicia o container do banco de testes automaticamente
- Roda migrations
- Executa todos os testes
- Remove o container ao finalizar

#### Rodar testes manualmente
```bash
cd backend

# Apenas testes unitários (rápidos, com mocks)
npm run test:unit

# Apenas testes de integração (com banco real)
docker-compose up -d db-test
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public" npx prisma migrate deploy
npm run test:integration

# Todos os testes
npm test
```

Veja mais detalhes em `backend/test/integration/README.md`.

## Endpoints principais
- `GET /produtos` | `POST /produtos` | `PATCH /produtos/:id` | `DELETE /produtos/:id`
- `PATCH /produtos/:id/disponibilidade`
- `GET /categorias` | `POST /categorias`
- `GET /mesas` | `PUT /mesas/configurar`
- `GET /pedidos` | `POST /pedidos` | `PATCH /pedidos/:id/status`
- Auth:
  - `POST /auth/admin/register` (nome, email, cpf, senha) — cria admin e restaurante vinculado (CPF validado pelo algoritmo oficial)
  - `POST /auth/admin/login` (email, senha) — retorna admin + restauranteId
  - `POST /auth/cozinha/login` (email, senha) — retorna usuário de cozinha + restauranteId
  - `POST /auth/master/login` (email, senha) — login do painel master (seed demo: founder@garcom.com / supermaster123)
- Master (apenas para usuários com role `master`):
  - `GET /master/restaurantes` — visão geral de trials, status e contatos
  - `PATCH /master/restaurantes/:id` — atualiza status de assinatura/trial ou dados de cobrança

## Notas
- O frontend espera a API em `http://localhost:3001` (ajuste com `VITE_API_URL`).
- Se a API não estiver rodando, os services do frontend usam fallback em `localStorage` + mocks.
- As requisições enviam `x-restaurante-id` (quando logado) para isolar dados de cada restaurante.
- Testes de integração usam banco PostgreSQL real (porta 5433) para validar constraints de banco.
- Cada novo admin já nasce com um restaurante em `trial` de 14 dias (campos trialStart/trialEnd e status `trialing`), pronto para ativar cobrança via Mercado Pago depois.

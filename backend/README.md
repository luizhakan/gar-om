# Backend (NestJS + Prisma) - Garçom Ágil

API REST robusta para gestão de restaurantes, pedidos e cardápios.

## Funcionalidades Principais
- **Multi-tenancy:** Suporte a múltiplos restaurantes (isolamento via `restauranteId`).
- **Gestão de Sessão:** Controle de mesas, comandas e histórico de pedidos.
- **Segurança:** Autenticação JWT, Hash de senhas (Bcrypt) e Validação de CPF.
- **Confiabilidade:** Testes automatizados (Unitários + Integração).

## Endpoints Principais

### Mesas & Comanda
- `GET /mesas` - Lista mesas do restaurante.
- `POST /mesas/configurar` - Define o layout do salão (gera QR Codes).
- `GET /mesas/:id/comanda` - **[NOVO]** Retorna todos os itens pedidos na sessão atual da mesa.
- `PATCH /mesas/:id/solicitar-conta` - Sinaliza para o garçom que a mesa quer pagar.
- `PATCH /mesas/:id/fechar` - Admin encerra a sessão, arquivando os pedidos e liberando a mesa.

### Pedidos
- `POST /pedidos` - Cria um novo pedido (status: pendente).
- `GET /pedidos` - Lista pedidos para a cozinha (fila).
- `PATCH /pedidos/:id/status` - Cozinha atualiza status (pendente -> preparando -> pronto).
- `PATCH /pedidos/:id` - Cliente edita o pedido (apenas se ainda estiver pendente e dentro do prazo).

### Produtos & Categorias
- CRUD completo para gestão do cardápio.
- Toggle de disponibilidade imediata (`PATCH /produtos/:id/disponibilidade`).

## Como Rodar# Backend (NestJS + Prisma) - Garçom Ágil

API REST robusta para gestão de restaurantes, pedidos e cardápios.

## Funcionalidades Principais
- **Multi-tenancy:** Suporte a múltiplos restaurantes (isolamento via `restauranteId`).
- **Gestão de Sessão:** Controle de mesas, comandas e histórico de pedidos.
- **Segurança:** Autenticação JWT, Hash de senhas (Bcrypt) e Validação de CPF.
- **Confiabilidade:** Testes automatizados (Unitários + Integração).

## Endpoints Principais

### Mesas & Comanda
- `GET /mesas` - Lista mesas do restaurante.
- `POST /mesas/configurar` - Define o layout do salão (gera QR Codes).
- `GET /mesas/:id/comanda` - **[NOVO]** Retorna todos os itens pedidos na sessão atual da mesa.
- `PATCH /mesas/:id/solicitar-conta` - Sinaliza para o garçom que a mesa quer pagar.
- `PATCH /mesas/:id/fechar` - Admin encerra a sessão, arquivando os pedidos e liberando a mesa.

### Pedidos
- `POST /pedidos` - Cria um novo pedido (status: pendente).
- `GET /pedidos` - Lista pedidos para a cozinha (fila).
- `PATCH /pedidos/:id/status` - Cozinha atualiza status (pendente -> preparando -> pronto).
- `PATCH /pedidos/:id` - Cliente edita o pedido (apenas se ainda estiver pendente e dentro do prazo).

### Produtos & Categorias
- CRUD completo para gestão do cardápio.
- Toggle de disponibilidade imediata (`PATCH /produtos/:id/disponibilidade`).

## Como Rodar

1. Subir o banco de dados:
   ```bash
   docker compose up -d db

1. Subir o banco de dados:
   ```bash
   docker compose up -d db
   Instalar dependências e configurar banco:

```bash

npm install
npm run prisma:migrate
npm run prisma:seed
```
Iniciar servidor:

```bash

npm run start:dev


Testes
O projeto possui uma suíte de testes completa.

Bash

# Rodar todos os testes (Unitários + Integração)
npm test

# Rodar apenas testes unitários (rápidos)
npm run test:unit

# Rodar apenas testes de integração (com banco real isolado)
npm run test:integration
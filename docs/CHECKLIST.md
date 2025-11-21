# Checklist de Implementação - Garçom Ágil

Este documento rastreia o progresso do desenvolvimento do MAV (Mínimo Ativo Viável).

## 1. Setup Inicial & Design System – Frontend
- [x] **Limpeza do Vite**
- [x] **Configuração de Estilos Globais**: Tokens, CSS Reset, Animações.
- [x] **Configuração de Rotas**: React Router com Layouts.

## 2. Domínio & Tipagem – Frontend
- [x] **Definição de Tipos**: Interfaces TypeScript completas.
- [x] **Mock Data**: (Substituído por integração real).

## 3. Módulo 1: Painel Admin (Dono)
- [x] **Auth**: Login e Registro integrados com API.
- [x] **Gestão de Produtos**: CRUD completo + Pausa de disponibilidade.
- [x] **Gestão de Mesas**: Criação, QR Code, Fechamento de Conta.

## 4. Módulo 2: Cliente (Cardápio Digital)
- [x] **Carrinho**: Persistência no LocalStorage.
- [x] **Página do Cardápio**: Listagem por categorias.
- [x] **Checkout / Comanda**:
    - [x] Envio de pedidos para API.
    - [x] Visualização de pedidos anteriores (Comanda).
    - [x] Solicitação de conta.
    - [x] Edição de pedido (enquanto pendente).

## 5. Módulo 3: Cozinha (Produção)
- [x] **Layout Cozinha**: Otimizado para TV/Tablet.
- [x] **Card de Pedido**: Ações de confirmar/finalizar.
- [x] **Sistema de Alerta**: Som e visual pulsante para novos pedidos.

## 6. Backend (NestJS + Prisma)
- [x] **Setup NestJS**: ValidationPipe, CORS, Prisma Service.
- [x] **Banco de Dados**: Schema robusto, Migrations, Seed.
- [x] **Endpoints**: Cobertura completa de CRUD e fluxos de negócio.
- [x] **Testes**:
    - [x] Unitários (Services).
    - [x] Integração (Banco real em Docker).

## 7. Polimento & Entrega
- [x] **Feedback Visual**: Toasts, Loadings, Estados Vazios.
- [x] **Tratamento de Erros**: Telas de 404 e Error Boundary.
- [x] **Design Premium**: Refatoração visual completa (Glassmorphism).
- [ ] **Build & Deploy**: Configuração de produção.
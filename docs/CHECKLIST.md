# Checklist de Implementação - Garçom Ágil

Este documento rastrea o progresso do desenvolvimento do MAV (Mínimo Ativo Viável).
Marque com `[x]` as tarefas concluídas.

## 1. Setup Inicial & Design System (Fundação) – Frontend
- [x] **Limpeza do Vite**: Remover arquivos de exemplo (`App.css`, logos), limpar `App.tsx` e `index.css`.
- [x] **Configuração de Estilos Globais**:
    - [x] Criar `frontend/src/styles/tokens.css` (Cores, Fontes, Espaçamentos).
    - [x] Criar `frontend/src/styles/global.css` (Reset CSS, Defaults).
    - [x] Criar `frontend/src/styles/animacoes.css` (Micro-interações).
    - [x] Importar estilos no `main.tsx`.
- [x] **Configuração de Rotas**:
    - [x] Instalar `react-router-dom`.
    - [x] Configurar roteador básico em `frontend/src/routes.tsx` (ou direto no App).
    - [x] Criar páginas "Placeholder" para `/admin`, `/cozinha` e `/mesa/:id`.

## 2. Domínio & Tipagem (O Coração) – Frontend
- [x] **Definição de Tipos (`frontend/src/types/`)**:
    - [x] `Produto.ts` (Interface de Produto).
    - [x] `Categoria.ts` (Interface de Categoria).
    - [x] `Pedido.ts` (Interface de Pedido e Itens).
    - [x] `Mesa.ts` (Interface de Mesa).
- [x] **Mock Data (Dados Falsos)**:
    - [x] Criar `src/mocks/cardapio.ts` para testar a UI sem backend.

## 3. Módulo 1: Painel Admin (Dono)
- [x] **Layout Admin**: Criar `frontend/src/layouts/LayoutAdmin` (Sidebar + Área de Conteúdo).
- [x] **Página de Login**: UI simples (sem integração real por enquanto).
- [x] **Gestão de Produtos**:
    - [x] Componente `CardProdutoAdmin`.
    - [x] Formulário de Criação/Edição de Produto.
    - [x] Listagem de Produtos.
- [x] **Gestão de Mesas**:
    - [x] Tela para definir número de mesas.
    - [x] Gerador de QR Code (usar lib `qrcode.react` ou similar).

## 4. Módulo 2: Cliente (Cardápio Digital)
- [x] **Layout Cliente**: Criar `frontend/src/layouts/LayoutCliente` (Header Fixo + Conteúdo).
- [x] **Contexto de Carrinho**:
    - [x] Criar `src/contexts/ContextoCarrinho.tsx`.
    - [x] Implementar lógica de adicionar/remover/total.
- [x] **Componentes de UI**:
    - [x] `CardProdutoCliente` (Foto, Nome, Preço, Botão Adicionar).
    - [x] `BotaoQuantidade` (+ / -).
    - [x] `ModalObservacao` (Para "sem cebola").
- [x] **Página do Cardápio**:
    - [x] Listagem por Categorias (Scroll suave ou Abas).
- [x] **Checkout / Carrinho**:
    - [x] Botão flutuante "Ver Comanda".
    - [x] Resumo do Pedido.
    - [x] Botão "Enviar para Cozinha".

## 5. Módulo 3: Cozinha (Produção)
- [x] **Layout Cozinha**: Focado em visualização à distância (TV/Tablet).
- [x] **Card de Pedido**:
    - [x] Destaque para Número da Mesa.
    - [x] Lista de itens com observações em vermelho/negrito.
    - [x] Timer (há quanto tempo o pedido chegou).
- [x] **Sistema de Alerta**:
    - [x] Componente de Áudio (tocar som quando chegar pedido novo).

## 6. Backend (NestJS + Prisma)
- [x] **Setup NestJS**: Estrutura básica, CORS e validação.
- [x] **Prisma**: Schema com `produtos`, `categorias`, `pedidos`, `itens_pedido`, `mesas`.
- [x] **Migrations/Seed**: Banco SQLite e script de seed.
- [x] **Endpoints**:
    - [x] `GET/POST/PATCH/DELETE /produtos`
    - [x] `GET/POST /categorias`
    - [x] `GET/PUT /mesas/configurar`
    - [x] `GET/POST /pedidos`
    - [x] `PATCH /pedidos/:id/status`
    - [x] Toggle de disponibilidade de produto

## 7. Polimento & Entrega
- [ ] **Feedback Visual**: Toasts de sucesso/erro.
- [ ] **Tratamento de Erros**: Telas de 404 e Error Boundary.
- [ ] **Build & Deploy**: Testar build de produção.

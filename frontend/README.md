# Frontend (React + Vite)

Aplicação React (TypeScript) com Vite, organizada por módulos (Admin, Cliente, Cozinha).

## Rodando localmente
1. `cd frontend`
2. `npm install`
3. `npm run dev` → http://localhost:5173

Use `VITE_API_URL` para apontar para a API Nest (padrão: `http://localhost:3001`). Se a API não estiver disponível, os services usam fallback em `localStorage` + mocks.

## Stack e padrões
- React 18+ com React Router.
- CSS Modules + tokens/variáveis em `src/styles`.
- Context API para Carrinho, Pedidos e Admin.
- Código, comentários e docs em PT-BR.

## Mapa rápido de pastas
```
src/
├── assets/      # Imagens e ícones
├── components/  # UI compartilhada
├── config/      # env e constantes
├── contexts/    # Contextos globais
├── hooks/       # Hooks customizados
├── layouts/     # Layouts de páginas
├── pages/       # Telas (Admin, Cliente, Cozinha)
├── services/    # Acesso à API + fallbacks locais
├── styles/      # Design System
├── types/       # Tipos de domínio
└── utils/       # Helpers
```

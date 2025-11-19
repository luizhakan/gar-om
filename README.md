# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Stack Tecnológico
- **Linguagem:** TypeScript (Rigoroso).
- **Frontend:** React + Vite.
- **Estilização:** Vanilla CSS (CSS Modules) com Variáveis CSS para Design System. **Foco em UI Premium.**
- **Gerenciamento de Estado:** React Context API + Hooks customizados.
- **Roteamento:** React Router DOM.
- **Backend/Banco de Dados:** Supabase (PostgreSQL + Realtime + Auth).

### 🇧🇷 Padrão de Idioma (Regra de Ouro)
- **Código:** Variáveis, Funções, Classes, Interfaces e Arquivos devem ser nomeados em **Português do Brasil**.
  - Exemplo: `function calcularTotalPedido()` ao invés de `calculateOrderTotal()`.
  - Exemplo: `interface Produto` ao invés de `interface Product`.
- **Comentários e Documentação:** 100% em Português do Brasil.
- **Commits:** Mensagens em Português do Brasil.
- **Exceção:** Bibliotecas de terceiros e configurações de ferramentas (ex: `vite.config.ts`, `package.json`) mantêm o padrão exigido pela ferramenta (geralmente inglês), mas o conteúdo customizado deve ser PT-BR.

### Estrutura de Diretórios (O Mapa)

A estrutura de pastas segue o padrão `Feature-First` mas adaptada para o nosso contexto. Manteremos os nomes das pastas raiz em inglês para compatibilidade com ferramentas, mas o conteúdo será em PT-BR.

```text
src/
├── assets/          # Imagens, fontes, ícones globais.
├── components/      # Componentes UI "Burros" (Apresentação).
│   ├── Botao/       # Nomes de componentes em PT-BR.
│   │   ├── index.tsx
│   │   ├── styles.module.css
│   │   └── LEIAME.md (Documentação de uso)
│   └── ...
├── config/          # Configurações globais.
├── contexts/        # Estado Global (Autenticacao, Carrinho).
├── hooks/           # Lógica reutilizável (useAutenticacao, useCarrinho).
├── layouts/         # Estruturas de página (LayoutAdmin, LayoutCliente).
├── pages/           # As telas da aplicação.
│   ├── Admin/       # Módulo 1: Painel Admin
│   ├── Cliente/     # Módulo 2: Cliente na Mesa
│   └── Cozinha/     # Módulo 3: Painel da Cozinha
├── services/        # Comunicação com API/Supabase.
├── styles/          # Design System global.
├── types/           # Definições de Tipos (Interfaces de Domínio).
└── utils/           # Funções auxiliares (formatarMoeda, validadores).
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

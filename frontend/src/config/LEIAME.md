# Config (Configurações)

Esta pasta contém arquivos de configuração global, constantes e variáveis de ambiente.
Não coloque lógica de negócio aqui, apenas dados estáticos ou de configuração.

## Padrão de Código (PT-BR)

### Exemplo: `env.ts`

```typescript
// Centraliza o acesso às variáveis de ambiente para evitar `process.env` ou `import.meta.env` espalhado
export const env = {
  api: {
    urlBase: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    chavePublica: import.meta.env.VITE_SUPABASE_KEY
  },
  app: {
    nome: 'Garçom Ágil',
    versao: '1.0.0'
  }
};
```

### Exemplo: `constantes.ts`

```typescript
export const TAMANHO_PAGINA_PADRAO = 20;

export const CATEGORIAS_PADRAO = [
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'lanches', label: 'Lanches' },
  { id: 'sobremesas', label: 'Sobremesas' }
];
```

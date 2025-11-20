# Types (Tipos)

Esta pasta contém as definições de tipos globais do TypeScript (Interfaces, Types, Enums).
Elas representam as **Entidades de Domínio** do nosso sistema.

## Padrão de Código (PT-BR)
- Use `interface` para objetos.
- Use `type` para uniões ou aliases simples.
- Nomes de arquivos devem ser em **PascalCase** (ex: `Produto.ts`).

### Exemplo: `Produto.ts`

```typescript
export interface Produto {
  id: string;
  nome: string;
  descricao?: string; // Opcional
  preco: number;
  categoriaId: string;
  disponivel: boolean;
}
```

### Exemplo: `Pedido.ts`

```typescript
import { Produto } from './Produto';

export type StatusPedido = 'pendente' | 'preparando' | 'pronto' | 'entregue';

export interface ItemPedido {
  produto: Produto;
  quantidade: number;
  observacao?: string;
}

export interface Pedido {
  id: string;
  mesa: number;
  itens: ItemPedido[];
  status: StatusPedido;
  criadoEm: Date;
}
```

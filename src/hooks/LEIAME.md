# Hooks

Esta pasta contém Hooks Customizados (Custom Hooks) para encapsular lógica de estado e efeitos colaterais reutilizáveis.
Hooks devem sempre começar com o prefixo `use` e seguir o padrão **camelCase**.

## Padrão de Código (PT-BR)

### Exemplo: `useCarrinho.ts`

```typescript
import { useState, useEffect } from 'react';
import { Produto } from '../types/Produto';

// Interface do estado do hook
interface ItemCarrinho extends Produto {
  quantidade: number;
}

export function useCarrinho() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  function adicionarItem(produto: Produto) {
    setItens((atual) => {
      const itemExistente = atual.find(item => item.id === produto.id);
      
      if (itemExistente) {
        return atual.map(item => 
          item.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [...atual, { ...produto, quantidade: 1 }];
    });
  }

  function removerItem(idProduto: string) {
    setItens(atual => atual.filter(item => item.id !== idProduto));
  }

  const total = itens.reduce((acc, item) => {
    return acc + (item.preco * item.quantidade);
  }, 0);

  return {
    itens,
    adicionarItem,
    removerItem,
    total
  };
}
```

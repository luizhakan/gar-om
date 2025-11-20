# Services

Esta pasta contém a camada de comunicação com serviços externos (API NestJS + Prisma).  
Seguimos o **Padrão Adapter** (ou Repository Pattern simplificado) para desacoplar a UI da fonte de dados.

## Regra de Ouro
Componentes **NUNCA** devem chamar `fetch` diretamente. Eles devem usar as funções dos services.  
Se a API estiver offline, os services cuidam do fallback em `localStorage`/mocks.

## Padrão de Código (PT-BR)

### Exemplo: `ServicoProdutos.ts`

```typescript
import { env } from '../config/env';
import type { Produto } from '../types/Produto';

const API = env.apiBaseUrl ?? 'http://localhost:3001';

export const ServicoProdutos = {
  async listarTodos(): Promise<Produto[]> {
    const resposta = await fetch(`${API}/produtos`);
    if (!resposta.ok) throw new Error('Erro ao buscar produtos');
    const data = await resposta.json();

    return data.map((item: any) => ({
      id: item.id,
      nome: item.nome,
      preco: Number(item.preco),
      descricao: item.descricao,
      idCategoria: item.idCategoria,
      disponivel: item.disponivel,
    }));
  },

  async criar(produto: Omit<Produto, 'id'>): Promise<Produto> {
    const resposta = await fetch(`${API}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto),
    });

    if (!resposta.ok) throw new Error('Erro ao criar produto');
    return resposta.json();
  }
};
```

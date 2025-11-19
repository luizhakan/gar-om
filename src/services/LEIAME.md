# Services

Esta pasta contém a camada de comunicação com serviços externos (APIs, Banco de Dados, Supabase).
Seguimos o **Padrão Adapter** (ou Repository Pattern simplificado) para desacoplar a UI da fonte de dados.

## Regra de Ouro
Componentes **NUNCA** devem chamar `fetch`, `axios` ou `supabase` diretamente. Eles devem chamar funções dos services.

## Padrão de Código (PT-BR)

### Exemplo: `ServicoProdutos.ts`

```typescript
import { supabase } from '../config/supabase';
import { Produto } from '../types/Produto';

export const ServicoProdutos = {
  async listarTodos(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*');

    if (error) {
      throw new Error('Erro ao buscar produtos: ' + error.message);
    }

    // Mapeamento para garantir que o retorno siga nossa interface (se necessário)
    return data.map(item => ({
      id: item.id,
      nome: item.nome,
      preco: item.preco,
      descricao: item.descricao,
      categoriaId: item.categoria_id
    }));
  },

  async criar(produto: Omit<Produto, 'id'>): Promise<Produto> {
    const { data, error } = await supabase
      .from('produtos')
      .insert([produto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
```

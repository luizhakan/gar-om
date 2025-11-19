# Pages (Páginas)

Esta pasta contém os componentes de página, que são os pontos de entrada das rotas da aplicação.
Cada página deve representar uma tela completa acessível por uma URL.

## Estrutura
Organizamos as páginas por Módulos (Features) para facilitar a navegação.

- `Admin/`: Páginas do Painel Administrativo.
- `Cliente/`: Páginas da interface do Cliente (Cardápio).
- `Cozinha/`: Páginas do Painel da Cozinha.

## Regra de Ouro
Páginas devem conter **pouca lógica de negócio**. Elas devem atuar como "maestros", orquestrando Layouts, Hooks e Componentes. Se a lógica ficar complexa, extraia para um Hook na pasta `hooks/`.

## Padrão de Código (PT-BR)

### Exemplo: `src/pages/Cliente/Cardapio.tsx`

```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutCliente } from '../../layouts/LayoutCliente';
import { ListaProdutos } from '../../components/ListaProdutos';
import { useCardapio } from '../../hooks/useCardapio';

export function PaginaCardapio() {
  const { idMesa } = useParams<{ idMesa: string }>();
  const { produtos, carregarProdutos, carregando } = useCardapio();

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <LayoutCliente titulo={`Mesa ${idMesa}`}>
      {carregando ? (
        <p>Carregando delícias...</p>
      ) : (
        <ListaProdutos produtos={produtos} />
      )}
    </LayoutCliente>
  );
}
```

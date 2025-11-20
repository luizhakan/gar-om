# Layouts

Esta pasta contém os componentes de Layout, que definem a estrutura comum (esqueleto) de um grupo de páginas.
Eles geralmente contêm Cabeçalhos, Rodapés, Menus Laterais e áreas de conteúdo dinâmico (`children` ou `Outlet`).

## Padrão de Código (PT-BR)

### Exemplo: `LayoutAdmin.tsx`

```tsx
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';

interface PropsLayoutAdmin {
  children: ReactNode;
  titulo: string;
}

export function LayoutAdmin({ children, titulo }: PropsLayoutAdmin) {
  return (
    <div className={styles.container}>
      <aside className={styles.barraLateral}>
        <nav>
          <Link to="/admin/produtos">Produtos</Link>
          <Link to="/admin/mesas">Mesas</Link>
        </nav>
      </aside>

      <main className={styles.conteudoPrincipal}>
        <header className={styles.cabecalho}>
          <h1>{titulo}</h1>
        </header>
        
        <div className={styles.areaConteudo}>
          {children}
        </div>
      </main>
    </div>
  );
}
```

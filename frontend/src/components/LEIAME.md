# Componentes

Esta pasta contém todos os componentes de UI reutilizáveis da aplicação.
Seguimos o padrão de **Componentes de Apresentação** (Presentational Components), ou seja, eles devem ser preferencialmente "burros" (stateless) e receber dados via `props`.

## Estrutura de um Componente

Cada componente deve ter sua própria pasta com o nome em **PascalCase** (ex: `Botao`, `CardProduto`).

```text
src/components/
└── NomeDoComponente/
    ├── index.tsx         # Lógica e JSX do componente
    ├── styles.module.css # Estilos escopados (CSS Modules)
    └── LEIAME.md         # Documentação específica do componente (opcional para simples)
```

## Exemplo de Código (Padrão PT-BR)

### `index.tsx`

```tsx
import styles from './styles.module.css';

interface PropsBotao extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario';
  carregando?: boolean;
  texto: string;
}

export function Botao({ 
  variante = 'primario', 
  carregando = false, 
  texto, 
  ...rest 
}: PropsBotao) {
  return (
    <button 
      className={`${styles.botao} ${styles[variante]}`} 
      disabled={carregando}
      {...rest}
    >
      {carregando ? 'Carregando...' : texto}
    </button>
  );
}
```

### `styles.module.css`

```css
.botao {
  padding: 0.5rem 1rem;
  border-radius: var(--raio-borda-md);
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primario {
  background-color: var(--cor-primaria);
  color: white;
}

.secundario {
  background-color: transparent;
  border: 1px solid var(--cor-primaria);
  color: var(--cor-primaria);
}
```

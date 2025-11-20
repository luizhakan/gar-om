# Assets (Ativos)

Esta pasta armazena arquivos estáticos como imagens, fontes, ícones (SVG) e arquivos globais que serão importados pelo código.

## Estrutura Sugerida

```text
src/assets/
├── imagens/      # Logos, backgrounds, fotos estáticas
├── icones/       # SVGs avulsos
└── fontes/       # Arquivos de fonte locais (se não usar Google Fonts)
```

## Como Importar

No Vite, você pode importar ativos diretamente no JavaScript/TypeScript:

```tsx
import logo from '../../assets/imagens/logo.png';
import { ReactComponent as IconeMenu } from '../../assets/icones/menu.svg'; // Se configurado plugin de SVG

export function Cabecalho() {
  return <img src={logo} alt="Logo Garçom Ágil" />;
}
```

# Styles (Estilos Globais)

Esta pasta contém os arquivos CSS globais e a definição do **Design System**.
Não coloque estilos de componentes específicos aqui (use CSS Modules nos componentes para isso).

## Estrutura

- `global.css`: Resets, fontes e estilos base do HTML.
- `tokens.css`: Variáveis CSS (Custom Properties) que definem as cores, espaçamentos e tipografia.
- `animacoes.css`: Keyframes reutilizáveis.

## Padrão de Código (PT-BR)

### Exemplo: `tokens.css`

```css
:root {
  /* Cores - Paleta Premium */
  --cor-fundo: #121214;
  --cor-superficie: #202024;
  --cor-texto-primario: #E1E1E6;
  --cor-texto-secundario: #A8A8B3;
  
  --cor-primaria: #8257E5; /* Roxo vibrante */
  --cor-primaria-clara: #996DFF;
  
  --cor-sucesso: #04D361;
  --cor-erro: #F75A68;

  /* Espaçamentos */
  --espaco-xs: 0.25rem;  /* 4px */
  --espaco-sm: 0.5rem;   /* 8px */
  --espaco-md: 1rem;     /* 16px */
  --espaco-lg: 1.5rem;   /* 24px */
  --espaco-xl: 2rem;     /* 32px */

  /* Fontes */
  --fonte-padrao: 'Inter', sans-serif;
  --tamanho-texto-sm: 0.875rem;
  --tamanho-texto-md: 1rem;
  --tamanho-titulo-lg: 1.5rem;
}
```

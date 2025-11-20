# Utils (Utilitários)

Esta pasta contém funções puras, auxiliares e formatadores que não dependem de estado do React ou de serviços externos.
Se a função apenas recebe um dado e retorna outro transformado, ela pertence aqui.

## Padrão de Código (PT-BR)

### Exemplo: `formatadores.ts`

```typescript
/**
 * Formata um número para o padrão de moeda Real Brasileiro (BRL).
 * @param valor Valor numérico a ser formatado
 * @returns String formatada (ex: R$ 10,00)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Gera um ID aleatório curto (útil para testes ou chaves temporárias).
 */
export function gerarIdAleatorio(): string {
  return Math.random().toString(36).substring(2, 9);
}
```

### Exemplo: `validadores.ts`

```typescript
export function ehEmailValido(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

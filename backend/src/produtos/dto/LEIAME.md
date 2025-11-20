# DTOs de Produtos

Validação de entrada para criação e atualização de produtos.

## Arquivos
- `criar-produto.dto.ts`: nome, preço, categoria e flags opcionais (`disponivel`, `imagemUrl`). Usa `class-validator` para garantir tipos e presença.
- `atualizar-produto.dto.ts`: extende `PartialType(CriarProdutoDto)` permitindo atualizações parciais sem repetir validações.

## Exemplo
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CriarProdutoDto } from './criar-produto.dto';

export class AtualizarProdutoDto extends PartialType(CriarProdutoDto) {}
```

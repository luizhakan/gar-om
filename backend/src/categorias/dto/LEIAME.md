# DTOs de Categorias

Validação de entrada para criação de categorias.

## Arquivo
- `criar-categoria.dto.ts`: valida nome obrigatório (`@IsNotEmpty`), ordem numérica (`@IsInt`) e id opcional.

## Exemplo
```typescript
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarCategoriaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsInt()
  ordem: number;
}
```

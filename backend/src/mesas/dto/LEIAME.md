# DTOs de Mesas

Entrada validada para configuração de mesas.

## Arquivo
- `configurar-mesas.dto.ts`: recebe `total` (int entre 1 e 200) e `baseUrl` opcional para montar o QR Code.

## Exemplo
```typescript
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ConfigurarMesasDto {
  @IsInt()
  @Min(1)
  @Max(200)
  total: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  baseUrl?: string;
}
```

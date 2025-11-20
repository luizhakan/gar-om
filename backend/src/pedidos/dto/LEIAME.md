# DTOs de Pedidos

Representam as entradas validadas para criação de pedidos e mudança de status.

## Arquivos
- `criar-pedido.dto.ts`: `idMesa` obrigatório, `status` opcional (padrão `pendente`) e array de itens validado com `@ValidateNested`.
- `item-pedido.dto.ts`: id do produto, quantidade mínima 1 e observação opcional.
- `atualizar-status.dto.ts`: status limitado a `pendente` | `preparando` | `pronto`.

## Exemplo
```typescript
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ItemPedidoDto } from './item-pedido.dto';

export class CriarPedidoDto {
  @IsString()
  @IsNotEmpty()
  idMesa: string;

  @IsOptional()
  @IsString()
  status?: 'pendente' | 'preparando' | 'pronto';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}
```

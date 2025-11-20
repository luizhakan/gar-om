import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ItemPedidoDto } from './item-pedido.dto';

export class CriarPedidoDto {
    @IsString()
    @IsNotEmpty()
    idMesa!: string;

    @IsOptional()
    @IsString()
    status?: 'pendente' | 'preparando' | 'pronto';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemPedidoDto)
    itens!: ItemPedidoDto[];
}

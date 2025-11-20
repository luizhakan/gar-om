import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemPedidoDto {
    @IsString()
    @IsNotEmpty()
    idProduto!: string;

    @IsInt()
    @IsNotEmpty()
    quantidade!: number;

    @IsString()
    @IsNotEmpty()
    observacao?: string;
}

export class EditarPedidoDto {
    @IsString()
    @IsNotEmpty()
    idMesa!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemPedidoDto)
    itens!: ItemPedidoDto[];
}

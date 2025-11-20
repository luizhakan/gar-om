import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ItemPedidoDto {
    @IsString()
    @IsNotEmpty()
    idProduto: string;

    @IsInt()
    @Min(1)
    quantidade: number;

    @IsOptional()
    @IsString()
    observacao?: string;
}

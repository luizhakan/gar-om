import { Type } from 'class-transformer';
import { 
    ArrayMaxSize, 
    ArrayMinSize, 
    IsArray, 
    IsNotEmpty, 
    IsOptional, 
    IsString, 
    ValidateNested 
} from 'class-validator';
import { ItemPedidoDto } from './item-pedido.dto';

export class CriarPedidoDto {
    @IsString()
    @IsNotEmpty()
    idMesa!: string;

    @IsOptional()
    @IsString()
    status?: 'pendente' | 'preparando' | 'pronto';

    @IsArray()
    @ArrayMinSize(1, { message: 'O pedido deve conter pelo menos 1 item' })
    @ArrayMaxSize(50, { message: 'O pedido não pode ter mais de 50 itens diferentes' })
    @ValidateNested({ each: true })
    @Type(() => ItemPedidoDto)
    itens!: ItemPedidoDto[];
}
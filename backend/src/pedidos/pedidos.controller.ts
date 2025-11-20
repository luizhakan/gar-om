import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';

@Controller('pedidos')
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) {}

    @Get()
    listar(@Headers('x-restaurante-id') restauranteId?: string) {
        return this.pedidosService.listar(restauranteId);
    }

    @Post()
    criar(@Body() dto: CriarPedidoDto, @Headers('x-restaurante-id') restauranteId?: string) {
        return this.pedidosService.criar(dto, restauranteId);
    }

    @Patch(':id/status')
    atualizarStatus(@Param('id') id: string, @Body() dto: AtualizarStatusDto) {
        return this.pedidosService.atualizarStatus(id, dto);
    }
}

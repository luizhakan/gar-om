import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';

@Controller('pedidos')
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) {}

    @Get()
    listar() {
        return this.pedidosService.listar();
    }

    @Post()
    criar(@Body() dto: CriarPedidoDto) {
        return this.pedidosService.criar(dto);
    }

    @Patch(':id/status')
    atualizarStatus(@Param('id') id: string, @Body() dto: AtualizarStatusDto) {
        return this.pedidosService.atualizarStatus(id, dto);
    }
}

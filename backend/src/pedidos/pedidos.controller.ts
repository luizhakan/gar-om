import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';

@Controller('pedidos')
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) {}

    @UseGuards(AuthGuard)
    @Roles('admin', 'cozinha')
    @Get()
    listar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.pedidosService.listar(usuario.restauranteId);
    }

    @Post()
    criar(@Body() dto: CriarPedidoDto, @Headers('x-restaurante-id') restauranteId?: string) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }

        return this.pedidosService.criar(dto, restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin', 'cozinha')
    @Patch(':id/status')
    atualizarStatus(
        @Param('id') id: string,
        @Body() dto: AtualizarStatusDto,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.pedidosService.atualizarStatus(id, dto, usuario.restauranteId);
    }
}

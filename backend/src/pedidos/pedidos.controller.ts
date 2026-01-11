import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { PedidosService } from './pedidos.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';
import { EditarPedidoDto } from './dto/editar-pedido.dto';

@Controller('pedidos')
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) {}

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin', 'cozinha')
    @Get()
    listar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.pedidosService.listar(usuario.restauranteId);
    }

    @UseGuards(ThrottlerGuard) 
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Máximo 3 pedidos por minuto por IP
    @Post()
    criar(
        @Body() dto: CriarPedidoDto,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }

        return this.pedidosService.criar(dto, restauranteId, tokenComanda);
    }

    @Patch(':id')
    editar(
        @Param('id') id: string,
        @Body() dto: EditarPedidoDto,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }

        return this.pedidosService.editar(id, dto, restauranteId, tokenComanda);
    }

    @Get(':id/status-publico')
    statusPublico(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.pedidosService.statusPublico(id, restauranteId, tokenComanda);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
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

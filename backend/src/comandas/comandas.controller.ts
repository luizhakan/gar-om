import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ComandasService } from './comandas.service';
import { SolicitarAcessoDto } from './dto/solicitar-acesso.dto';
import { SolicitarAcessoMesaDto } from './dto/solicitar-acesso-mesa.dto';
import { TrocarMesaDto } from './dto/trocar-mesa.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';

@Controller('comandas')
export class ComandasController {
    constructor(private readonly comandasService: ComandasService) {}

    @Post('solicitar-acesso')
    solicitarAcesso(
        @Body() dto: SolicitarAcessoDto,
        @Headers('x-restaurante-id') restauranteId?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.solicitarAcesso(dto.codigo, restauranteId, dto.apelido);
    }

    @Post('solicitar-acesso-mesa')
    solicitarAcessoMesa(
        @Body() dto: SolicitarAcessoMesaDto,
        @Headers('x-restaurante-id') restauranteId?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.solicitarAcessoMesa(dto.idMesa, restauranteId, dto.apelido);
    }

    @Get('dispositivos/:id/status')
    consultarSolicitacao(
        @Param('id') id: string,
        @Query('codigo') codigo?: string,
        @Headers('x-restaurante-id') restauranteId?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        if (!codigo) {
            throw new BadRequestException('Código da comanda é obrigatório');
        }
        return this.comandasService.consultarSolicitacao(id, codigo, restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Get('por-mesa/:id')
    obterComandaPorMesa(
        @Param('id') id: string,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.comandasService.obterComandaPorMesa(id, usuario.restauranteId);
    }

    @Get(':id')
    obterResumo(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.obterResumo(id, restauranteId, tokenComanda);
    }

    @Get(':id/pedidos')
    obterPedidos(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.obterPedidos(id, restauranteId, tokenComanda);
    }

    @Get(':id/dispositivos')
    listarDispositivos(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.listarDispositivos(id, restauranteId, tokenComanda);
    }

    @Patch(':id/dispositivos/:idDispositivo/aprovar')
    aprovarDispositivo(
        @Param('id') id: string,
        @Param('idDispositivo') idDispositivo: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.aprovarDispositivo(id, restauranteId, idDispositivo, tokenComanda);
    }

    @Patch(':id/dispositivos/:idDispositivo/recusar')
    recusarDispositivo(
        @Param('id') id: string,
        @Param('idDispositivo') idDispositivo: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.recusarDispositivo(id, restauranteId, idDispositivo, tokenComanda);
    }

    @Patch(':id/dispositivos/:idDispositivo/revogar')
    revogarDispositivo(
        @Param('id') id: string,
        @Param('idDispositivo') idDispositivo: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.revogarDispositivo(id, restauranteId, idDispositivo, tokenComanda);
    }

    @Patch(':id/trocar-mesa')
    trocarMesa(
        @Param('id') id: string,
        @Body() dto: TrocarMesaDto,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.trocarMesa(id, restauranteId, dto.numeroMesa, tokenComanda);
    }

    @Patch(':id/solicitar-conta')
    solicitarConta(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.solicitarConta(id, restauranteId, tokenComanda);
    }

    @Patch(':id/reabrir-conta')
    reabrirConta(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Headers('x-comanda-token') tokenComanda?: string,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.comandasService.reabrirConta(id, restauranteId, tokenComanda);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Patch(':id/admin/virar-master')
    adminVirarMaster(
        @Param('id') id: string,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.comandasService.adminVirarMaster(id, usuario.restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Patch(':id/admin/definir-master/:idDispositivo')
    adminDefinirMaster(
        @Param('id') id: string,
        @Param('idDispositivo') idDispositivo: string,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.comandasService.adminDefinirMaster(id, usuario.restauranteId, idDispositivo);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Patch(':id/admin/encerrar')
    adminEncerrar(
        @Param('id') id: string,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.comandasService.adminEncerrar(id, usuario.restauranteId);
    }
}

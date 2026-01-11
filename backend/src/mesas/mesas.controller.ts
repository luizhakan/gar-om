import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { MesasService } from './mesas.service';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';
import { AdicionarMesaDto } from './dto/adicionar-mesa.dto';
import { ConfigurarMesasDto } from './dto/configurar-mesas.dto';
import type { Request } from 'express';
import { extrairIpCliente } from '../utils/ip.util';

@Controller('mesas')
export class MesasController {
    constructor(private readonly mesasService: MesasService) {}

    private extrairBaseUrl(req: Request, baseUrl?: string): string {
        // Prioriza a baseUrl recebida do frontend (window.location.origin)
        if (baseUrl) {
            try {
                return new URL(baseUrl).origin;
            } catch {
                // Se a URL for inválida, continua para os fallbacks
            }
        }

        // Fallback: tenta usar a variável de ambiente
        const daEnv = process.env.FRONTEND_URL;
        if (daEnv) {
            try {
                return new URL(daEnv).origin;
            } catch {
                // Se a URL da env for inválida, continua
            }
        }

        // Fallback final: localhost
        return 'http://localhost:5173';
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin', 'cozinha')
    @Get()
    listar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.listar(usuario.restauranteId);
    }

    @Get(':id/status-publico')
    statusPublico(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Req() req?: Request,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        const ip = req ? extrairIpCliente(req) : undefined;
        return this.mesasService.statusPublico(id, restauranteId, ip);
    }

    @Get(':id/comanda')
    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin', 'cozinha')
    obterComanda(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Req() req?: Request,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        const ip = req ? extrairIpCliente(req) : undefined;
        return this.mesasService.obterComanda(id, restauranteId, ip);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Post()
    adicionar(
        @Body() dto: AdicionarMesaDto,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
        @Req() req: Request,
    ) {
        const baseUrl = this.extrairBaseUrl(req, dto.baseUrl);
        return this.mesasService.adicionar(dto.numero, baseUrl, usuario.restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Post('configurar')
    configurar(
        @Body() dto: ConfigurarMesasDto,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
        @Req() req: Request,
    ) {
        const baseUrl = this.extrairBaseUrl(req, dto.baseUrl);
        return this.mesasService.configurar(dto.total, baseUrl, usuario.restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Delete(':id')
    excluir(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.excluir(id, usuario.restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Patch(':id/fechar')
    fechar(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.fechar(id, usuario.restauranteId);
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
        return this.mesasService.solicitarConta(id, restauranteId, tokenComanda);
    }
}

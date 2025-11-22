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
        const daEnv = process.env.FRONTEND_URL;
        if (daEnv) return daEnv;

        const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
        const protocolo = forwardedProto || req.protocol || 'http';
        const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;

        if (host) {
            return `${protocolo}://${host}`;
        }

        return baseUrl || 'http://localhost:5173';
    }

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Delete(':id')
    excluir(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.excluir(id, usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Patch(':id/fechar')
    fechar(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.fechar(id, usuario.restauranteId);
    }

    @Patch(':id/solicitar-conta')
    solicitarConta(
        @Param('id') id: string,
        @Headers('x-restaurante-id') restauranteId?: string,
        @Req() req?: Request,
    ) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        const ip = req ? extrairIpCliente(req) : undefined;
        return this.mesasService.solicitarConta(id, restauranteId, ip);
    }
}

import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';
import { AdicionarMesaDto } from './dto/adicionar-mesa.dto';
import { ConfigurarMesasDto } from './dto/configurar-mesas.dto';

@Controller('mesas')
export class MesasController {
    constructor(private readonly mesasService: MesasService) {}

    @UseGuards(AuthGuard)
    @Roles('admin', 'cozinha')
    @Get()
    listar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.listar(usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Post()
    adicionar(@Body() dto: AdicionarMesaDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
        return this.mesasService.adicionar(dto.numero, baseUrl, usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Post('configurar')
    configurar(@Body() dto: ConfigurarMesasDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
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
    solicitarConta(@Param('id') id: string, @Headers('x-restaurante-id') restauranteId?: string) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.mesasService.solicitarConta(id, restauranteId);
    }
}

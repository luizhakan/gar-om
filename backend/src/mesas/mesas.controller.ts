import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { ConfigurarMesasDto } from './dto/configurar-mesas.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';

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
    @Put('configurar')
    configurar(@Body() dto: ConfigurarMesasDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
        return this.mesasService.configurar(dto.total, baseUrl, usuario.restauranteId);
    }
}

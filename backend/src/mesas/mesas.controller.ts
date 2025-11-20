import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MesasService } from './mesas.service';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';
import { AdicionarMesaDto } from './dto/adicionar-mesa.dto';

@Controller('mesas')
@UseGuards(AuthGuard)
export class MesasController {
    constructor(private readonly mesasService: MesasService) {}

    @Roles('admin', 'cozinha')
    @Get()
    listar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.listar(usuario.restauranteId);
    }

    @Roles('admin')
    @Post()
    adicionar(@Body() dto: AdicionarMesaDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        const baseUrl = dto.baseUrl || 'http://localhost:5173';
        return this.mesasService.adicionar(dto.numero, baseUrl, usuario.restauranteId);
    }

    @Roles('admin')
    @Delete(':id')
    excluir(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.mesasService.excluir(id, usuario.restauranteId);
    }
}

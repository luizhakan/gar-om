import { BadRequestException, Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';

@Controller('categorias')
export class CategoriasController {
    constructor(private readonly categoriasService: CategoriasService) {}

    @Get()
    listar(@Headers('x-restaurante-id') restauranteId?: string) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.categoriasService.listar(restauranteId);
    }

    @UseGuards(AuthGuard, SubscriptionGuard)
    @Roles('admin')
    @Post()
    criar(@Body() dto: CriarCategoriaDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.categoriasService.criar(
            {
                id: dto.id,
                nome: dto.nome,
                ordem: dto.ordem,
            },
            usuario.restauranteId,
        );
    }
}

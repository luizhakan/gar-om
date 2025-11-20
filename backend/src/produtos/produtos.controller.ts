import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';
import { AuthGuard, Roles } from '../auth/auth.guard';
import { UsuarioAutenticado } from '../auth/auth-user.decorator';
import type { AuthTokenPayload } from '../auth/token.util';

@Controller('produtos')
export class ProdutosController {
    constructor(private readonly produtosService: ProdutosService) {}

    @Get()
    listar(@Headers('x-restaurante-id') restauranteId?: string) {
        if (!restauranteId) {
            throw new BadRequestException('Cabeçalho x-restaurante-id é obrigatório');
        }
        return this.produtosService.listar(restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Post()
    criar(@Body() dto: CriarProdutoDto, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.produtosService.criar(dto, usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Patch(':id')
    atualizar(
        @Param('id') id: string,
        @Body() dto: AtualizarProdutoDto,
        @UsuarioAutenticado() usuario: AuthTokenPayload,
    ) {
        return this.produtosService.atualizar(id, dto, usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Delete(':id')
    remover(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.produtosService.remover(id, usuario.restauranteId);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Patch(':id/disponibilidade')
    alternarDisponibilidade(@Param('id') id: string, @UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.produtosService.alternarDisponibilidade(id, usuario.restauranteId);
    }
}

import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';

@Controller('produtos')
export class ProdutosController {
    constructor(private readonly produtosService: ProdutosService) {}

    @Get()
    listar(@Headers('x-restaurante-id') restauranteId?: string) {
        return this.produtosService.listar(restauranteId);
    }

    @Post()
    criar(@Body() dto: CriarProdutoDto, @Headers('x-restaurante-id') restauranteId?: string) {
        return this.produtosService.criar(dto, restauranteId);
    }

    @Patch(':id')
    atualizar(@Param('id') id: string, @Body() dto: AtualizarProdutoDto) {
        return this.produtosService.atualizar(id, dto);
    }

    @Delete(':id')
    remover(@Param('id') id: string) {
        return this.produtosService.remover(id);
    }

    @Patch(':id/disponibilidade')
    alternarDisponibilidade(@Param('id') id: string) {
        return this.produtosService.alternarDisponibilidade(id);
    }
}

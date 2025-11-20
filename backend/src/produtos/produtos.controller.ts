import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';

@Controller('produtos')
export class ProdutosController {
    constructor(private readonly produtosService: ProdutosService) {}

    @Get()
    listar() {
        return this.produtosService.listar();
    }

    @Post()
    criar(@Body() dto: CriarProdutoDto) {
        return this.produtosService.criar(dto);
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

import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@Controller('categorias')
export class CategoriasController {
    constructor(private readonly categoriasService: CategoriasService) {}

    @Get()
    listar() {
        return this.categoriasService.listar();
    }

    @Post()
    criar(@Body() dto: CriarCategoriaDto, @Headers('x-restaurante-id') restauranteId?: string) {
        return this.categoriasService.criar({
            id: dto.id,
            nome: dto.nome,
            ordem: dto.ordem,
        }, restauranteId);
    }
}

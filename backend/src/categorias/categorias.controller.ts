import { Body, Controller, Get, Post } from '@nestjs/common';
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
    criar(@Body() dto: CriarCategoriaDto) {
        return this.categoriasService.criar({
            id: dto.id,
            nome: dto.nome,
            ordem: dto.ordem,
        });
    }
}

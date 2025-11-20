import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
    constructor(private prisma: PrismaService) {}

    listar() {
        return this.prisma.categoria.findMany({
            orderBy: { ordem: 'asc' },
        });
    }

    criar(dados: Prisma.CategoriaCreateInput) {
        return this.prisma.categoria.create({ data: dados });
    }
}

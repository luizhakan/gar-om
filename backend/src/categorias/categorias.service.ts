import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
    constructor(private prisma: PrismaService) {}

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.categoria.findMany({
            where: { restauranteId },
            orderBy: { ordem: 'asc' },
        });
    }

    async criar(
        dados: Omit<Prisma.CategoriaCreateInput, 'restaurante'>,
        restauranteId: string,
    ) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.categoria.create({
            data: {
                id: dados.id,
                nome: dados.nome,
                ordem: dados.ordem,
                restaurante: { connect: { id: restaurante.id } },
            },
        });
    }
}

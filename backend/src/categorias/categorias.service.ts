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

    async criar(
        dados: Omit<Prisma.CategoriaCreateInput, 'restaurante'> & { restauranteId?: string },
        restauranteId?: string,
    ) {
        const restaurante = restauranteId
            ? await this.prisma.restaurante.upsert({
                where: { id: restauranteId },
                update: {},
                create: { id: restauranteId, nome: 'Restaurante Default' },
            })
            : await this.prisma.restaurante.findFirst();

        const restauranteDestino =
            restaurante ??
            (await this.prisma.restaurante.create({
                data: { id: 'restaurante-default', nome: 'Restaurante Default' },
            })) ??
            { id: restauranteId ?? 'restaurante-default' };

        return this.prisma.categoria.create({
            data: {
                id: dados.id,
                nome: dados.nome,
                ordem: dados.ordem,
                restaurante: { connect: { id: restauranteDestino.id } },
            },
        });
    }
}

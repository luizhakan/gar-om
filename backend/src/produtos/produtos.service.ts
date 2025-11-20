import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProdutosService {
    constructor(private prisma: PrismaService) {}

    async listar(restauranteId?: string) {
        const restaurante = restauranteId
            ? await this.prisma.restaurante.findUnique({ where: { id: restauranteId } })
            : await this.prisma.restaurante.findFirst();
        return this.prisma.produto.findMany({
            where: restaurante ? { restauranteId: restaurante.id } : undefined,
            orderBy: { nome: 'asc' },
        });
    }

    async criar(dados: Prisma.ProdutoCreateInput, restauranteId?: string) {
        const restaurante = restauranteId
            ? await this.prisma.restaurante.findUnique({ where: { id: restauranteId } })
            : await this.prisma.restaurante.findFirst();
        return this.prisma.produto.create({
            data: {
                ...dados,
                restaurante: restaurante
                    ? { connect: { id: restaurante.id } }
                    : { create: { nome: 'Restaurante Default' } },
            },
        });
    }

    async atualizar(id: string, dados: Prisma.ProdutoUpdateInput) {
        const existe = await this.prisma.produto.findUnique({ where: { id } });
        if (!existe) throw new NotFoundException('Produto não encontrado');

        return this.prisma.produto.update({
            where: { id },
            data: dados,
        });
    }

    async remover(id: string) {
        const existe = await this.prisma.produto.findUnique({ where: { id } });
        if (!existe) throw new NotFoundException('Produto não encontrado');

        await this.prisma.produto.delete({ where: { id } });
        return { ok: true };
    }

    async alternarDisponibilidade(id: string) {
        const produto = await this.prisma.produto.findUnique({ where: { id } });
        if (!produto) throw new NotFoundException('Produto não encontrado');

        return this.prisma.produto.update({
            where: { id },
            data: { disponivel: !produto.disponivel },
        });
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProdutosService {
    constructor(private prisma: PrismaService) {}

    listar() {
        return this.prisma.produto.findMany({
            orderBy: { nome: 'asc' },
        });
    }

    async criar(dados: Prisma.ProdutoCreateInput) {
        return this.prisma.produto.create({ data: dados });
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

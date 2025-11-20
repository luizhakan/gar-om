import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CriarProdutoDto } from './dto/criar-produto.dto';
import type { AtualizarProdutoDto } from './dto/atualizar-produto.dto';

@Injectable()
export class ProdutosService {
    constructor(private prisma: PrismaService) {}

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.produto.findMany({
            where: { restauranteId: restaurante.id },
            orderBy: { nome: 'asc' },
        });
    }

    async criar(
        dados: Omit<Prisma.ProdutoCreateInput, 'restaurante' | 'categoria'> & { idCategoria: string },
        restauranteId: string,
    ) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const categoria = await this.prisma.categoria.findUnique({ where: { id: dados.idCategoria } });
        if (!categoria || categoria.restauranteId !== restaurante.id) {
            throw new UnauthorizedException('Categoria não pertence ao restaurante');
        }

        const { idCategoria, ...resto } = dados;

        return this.prisma.produto.create({
            data: {
                ...resto,
                restaurante: { connect: { id: restaurante.id } },
                categoria: { connect: { id: idCategoria } },
            },
        });
    }

    async atualizar(id: string, dados: AtualizarProdutoDto, restauranteId: string) {
        const produto = await this.prisma.produto.findUnique({ where: { id } });
        if (!produto) throw new NotFoundException('Produto não encontrado');
        if (produto.restauranteId !== restauranteId) throw new UnauthorizedException('Produto pertence a outro restaurante');

        if (dados.idCategoria) {
            const categoria = await this.prisma.categoria.findUnique({ where: { id: dados.idCategoria } });
            if (!categoria || categoria.restauranteId !== restauranteId) {
                throw new UnauthorizedException('Categoria não pertence ao restaurante');
            }
        }

        return this.prisma.produto.update({
            where: { id },
            data: {
                nome: dados.nome ?? undefined,
                descricao: dados.descricao ?? undefined,
                preco: dados.preco ?? undefined,
                idCategoria: dados.idCategoria ?? undefined,
                disponivel: dados.disponivel ?? undefined,
                imagemUrl: dados.imagemUrl ?? undefined,
            },
        });
    }

    async remover(id: string, restauranteId: string) {
        const existe = await this.prisma.produto.findUnique({ where: { id } });
        if (!existe) throw new NotFoundException('Produto não encontrado');
        if (existe.restauranteId !== restauranteId) throw new UnauthorizedException('Produto pertence a outro restaurante');

        await this.prisma.produto.delete({ where: { id } });
        return { ok: true };
    }

    async alternarDisponibilidade(id: string, restauranteId: string) {
        const produto = await this.prisma.produto.findUnique({ where: { id } });
        if (!produto) throw new NotFoundException('Produto não encontrado');
        if (produto.restauranteId !== restauranteId) throw new UnauthorizedException('Produto pertence a outro restaurante');

        return this.prisma.produto.update({
            where: { id },
            data: { disponivel: !produto.disponivel },
        });
    }
}

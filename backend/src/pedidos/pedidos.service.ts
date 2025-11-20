import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PedidoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';

@Injectable()
export class PedidosService {
    constructor(private prisma: PrismaService) {}

    private formatarPedido(pedido: any) {
        return {
            id: pedido.id,
            idMesa: pedido.mesa?.numero ? String(pedido.mesa.numero) : pedido.idMesa,
            status: pedido.status,
            dataCriacao: pedido.dataCriacao,
            dataAtualizacao: pedido.dataAtualizacao ?? undefined,
            itens: pedido.itens.map((item: any) => ({
                idProduto: item.produtoId,
                quantidade: item.quantidade,
                observacao: item.observacao ?? undefined,
                produto: item.produto
                    ? {
                        id: item.produto.id,
                        nome: item.produto.nome,
                        descricao: item.produto.descricao ?? undefined,
                        preco: item.produto.preco,
                        idCategoria: item.produto.idCategoria,
                        disponivel: item.produto.disponivel,
                        imagemUrl: item.produto.imagemUrl ?? undefined,
                    }
                    : undefined,
            })),
        };
    }

    private async garantirMesa(idMesaRecebido: string, restauranteId: string) {
        const numeroMesa = Number(idMesaRecebido);
        const mesaExistente = await this.prisma.mesa.findFirst({
            where: {
                restauranteId,
                OR: [
                    { id: idMesaRecebido },
                    Number.isInteger(numeroMesa) ? { numero: numeroMesa } : undefined,
                ].filter(Boolean) as Prisma.MesaWhereInput[],
            },
        });

        if (mesaExistente) return mesaExistente;

        throw new NotFoundException('Mesa não encontrada para o restaurante informado');
    }

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const pedidos = await this.prisma.pedido.findMany({
            where: { restauranteId },
            orderBy: { dataCriacao: 'desc' },
            include: {
                mesa: true,
                itens: {
                    include: { produto: true },
                },
            },
        });

        return pedidos.map(p => this.formatarPedido(p));
    }

    async criar(dto: CriarPedidoDto, restauranteId: string) {
        if (!restauranteId) {
            throw new BadRequestException('Restaurante não informado');
        }

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const mesa = await this.garantirMesa(dto.idMesa, restaurante.id);

        const itensPreparados = [];
        for (const item of dto.itens) {
            const produto = await this.prisma.produto.findUnique({
                where: { id: item.idProduto },
            });

            if (!produto) {
                throw new NotFoundException(`Produto não encontrado: ${item.idProduto}`);
            }
            if (produto.restauranteId !== restaurante.id) {
                throw new UnauthorizedException('Um ou mais produtos não pertencem ao restaurante');
            }

            itensPreparados.push({
                produtoId: item.idProduto,
                quantidade: item.quantidade,
                observacao: item.observacao,
                precoUnitario: produto.preco,
            });
        }

        const pedidoCriado = await this.prisma.pedido.create({
            data: {
                idMesa: mesa.id,
                restauranteId: restaurante.id,
                status: PedidoStatus.pendente,
                itens: {
                    create: itensPreparados,
                },
            },
            include: {
                mesa: true,
                itens: { include: { produto: true } },
            },
        });

        return this.formatarPedido(pedidoCriado);
    }

    async atualizarStatus(id: string, dto: AtualizarStatusDto, restauranteId: string) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id } });
        if (!pedido) throw new NotFoundException('Pedido não encontrado');
        if (pedido.restauranteId !== restauranteId) throw new UnauthorizedException('Pedido pertence a outro restaurante');

        const atualizado = await this.prisma.pedido.update({
            where: { id },
            data: {
                status: dto.status as PedidoStatus,
                dataAtualizacao: new Date(),
            },
            include: {
                mesa: true,
                itens: { include: { produto: true } },
            },
        });

        return this.formatarPedido(atualizado);
    }
}

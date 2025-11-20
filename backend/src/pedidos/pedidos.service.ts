import { Injectable, NotFoundException } from '@nestjs/common';
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

    private async garantirMesa(idMesaRecebido: string, restauranteId?: string) {
        const numeroMesa = Number(idMesaRecebido);
        const mesaExistente = await this.prisma.mesa.findFirst({
            where: {
                OR: [
                    { id: idMesaRecebido },
                    Number.isInteger(numeroMesa) ? { numero: numeroMesa } : undefined,
                ].filter(Boolean) as Prisma.MesaWhereInput[],
            },
        });

        if (mesaExistente) return mesaExistente;

        const restaurante = restauranteId
            ? await this.prisma.restaurante.upsert({
                where: { id: restauranteId },
                update: {},
                create: { id: restauranteId, nome: 'Restaurante Default' },
            })
            : await (this.prisma.restaurante.findFirst() ?? this.prisma.restaurante.create({
                data: { id: 'restaurante-default', nome: 'Restaurante Default' },
            }));

        const numeroParaCriar = Number.isInteger(numeroMesa)
            ? numeroMesa
            : await this.prisma.mesa.count({ where: { restauranteId: restaurante.id } }) + 1;

        return this.prisma.mesa.create({
            data: {
                id: `mesa-${numeroParaCriar}`,
                numero: numeroParaCriar,
                codigoQr: `http://localhost:5173/mesa/${numeroParaCriar}`,
                ocupada: false,
                restauranteId: restaurante.id,
            },
        });
    }

    async listar(restauranteId?: string) {
        const pedidos = await this.prisma.pedido.findMany({
            where: restauranteId ? { restauranteId } : undefined,
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

    async criar(dto: CriarPedidoDto, restauranteId?: string) {
        const mesa = await this.garantirMesa(dto.idMesa, restauranteId);

        const itensPreparados = [];
        for (const item of dto.itens) {
            const produto = await this.prisma.produto.findUnique({
                where: { id: item.idProduto },
            });

            if (!produto) {
                throw new NotFoundException(`Produto não encontrado: ${item.idProduto}`);
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
                restauranteId: mesa.restauranteId,
                status: (dto.status as PedidoStatus) || PedidoStatus.pendente,
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

    async atualizarStatus(id: string, dto: AtualizarStatusDto) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id } });
        if (!pedido) throw new NotFoundException('Pedido não encontrado');

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

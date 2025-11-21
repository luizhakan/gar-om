import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PedidoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { EditarPedidoDto } from './dto/editar-pedido.dto';
import { PedidosGateway } from './pedidos.gateway';

@Injectable()
export class PedidosService {
    constructor(private prisma: PrismaService, private pedidosGateway: PedidosGateway) { }

    private formatarPedido(pedido: any) {
        return {
            id: pedido.id,
            idMesa: pedido.mesa?.numero ? String(pedido.mesa.numero) : pedido.idMesa,
            restauranteId: pedido.restauranteId,
            status: pedido.status,
            encerrado: pedido.encerrado, // Novo campo
            dataCriacao: pedido.dataCriacao,
            dataAtualizacao: pedido.dataAtualizacao ?? undefined,
            itens: pedido.itens.map((item: any) => ({
                idProduto: item.produtoId,
                quantidade: item.quantidade,
                observacao: item.observacao ?? undefined,
                precoUnitario: item.precoUnitario,
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
                encerrado: false, // Default
                itens: {
                    create: itensPreparados,
                },
            },
            include: {
                mesa: true,
                itens: { include: { produto: true } },
            },
        });

        // Marca mesa como ocupada se necessário
        if (!mesa.ocupada) {
            await this.prisma.mesa.update({
                where: { id: mesa.id },
                data: { ocupada: true, contaSolicitada: false },
            });
        }

        const pedidoFormatado = this.formatarPedido(pedidoCriado);

        this.pedidosGateway.emitirNovoPedido(restauranteId, pedidoFormatado); //
        return pedidoFormatado;
    }

    async editar(id: string, dto: EditarPedidoDto, restauranteId: string) {
        if (!restauranteId) throw new BadRequestException('Restaurante não informado');

        const pedidoExistente = await this.prisma.pedido.findUnique({
            where: { id },
            include: { mesa: true },
        });

        if (!pedidoExistente) throw new NotFoundException('Pedido não encontrado');
        if (pedidoExistente.restauranteId !== restauranteId) {
            throw new UnauthorizedException('Pedido pertence a outro restaurante');
        }
        if (pedidoExistente.encerrado) {
            throw new BadRequestException('Pedido já encerrado (conta fechada)');
        }

        const agora = new Date();
        const criadoEm = pedidoExistente.dataCriacao;
        const diffSegundos = (agora.getTime() - criadoEm.getTime()) / 1000;
        if (diffSegundos > 90) {
            throw new BadRequestException('Pedido só pode ser editado até 1min30s após o envio');
        }

        if (pedidoExistente.status !== PedidoStatus.pendente) {
            throw new BadRequestException('Pedido já confirmado pela cozinha e não pode ser editado');
        }

        if (pedidoExistente.mesa?.contaSolicitada) {
            throw new BadRequestException('Conta solicitada, edição bloqueada');
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

        const atualizado = await this.prisma.pedido.update({
            where: { id: pedidoExistente.id },
            data: {
                idMesa: mesa.id,
                status: PedidoStatus.pendente,
                dataAtualizacao: new Date(),
                itens: {
                    deleteMany: { pedidoId: pedidoExistente.id },
                    create: itensPreparados,
                },
            },
            include: {
                mesa: true,
                itens: { include: { produto: true } },
            },
        });

        return this.formatarPedido(atualizado);
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

        const pedidoFormatado = this.formatarPedido(atualizado);

        this.pedidosGateway.emitirAtualizacaoPedido(
            restauranteId,
            atualizado.idMesa, // idMesa do pedido atualizado
            pedidoFormatado
        );

        return pedidoFormatado;
    }

    async statusPublico(id: string, restauranteId: string) {
        if (!restauranteId) throw new BadRequestException('Restaurante não informado');
        const pedido = await this.prisma.pedido.findUnique({
            where: { id },
            include: { mesa: true, itens: { include: { produto: true } } },
        });

        if (!pedido) throw new NotFoundException('Pedido não encontrado');
        if (pedido.restauranteId !== restauranteId) {
            throw new UnauthorizedException('Pedido pertence a outro restaurante');
        }

        // Se encerrado, não aplicamos limite de tempo para ver a comanda histórica, 
        // mas o frontend pode decidir não mostrar.
        // Mantemos o limite para evitar scraping excessivo de pedidos antigos
        const agora = new Date();
        const limiteHoras = 24; // Aumentado para cobrir a sessão da mesa
        const diffHoras = (agora.getTime() - pedido.dataCriacao.getTime()) / (1000 * 60 * 60);
        if (diffHoras > limiteHoras) {
            throw new BadRequestException('Status público indisponível para pedidos antigos');
        }

        return this.formatarPedido(pedido);
    }
}
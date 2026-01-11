import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ComandaStatus, DispositivoStatus, PedidoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { EditarPedidoDto } from './dto/editar-pedido.dto';
import { PedidosGateway } from './pedidos.gateway';
import { gerarCodigoComanda, gerarTokenComanda, hashTokenComanda } from '../comandas/comanda.util';

@Injectable()
export class PedidosService {
    constructor(private prisma: PrismaService, private pedidosGateway: PedidosGateway) { }

    private async validarTokenComanda(
        comandaId: string,
        tokenComanda?: string,
        exigirMaster = false,
    ) {
        if (!tokenComanda) {
            throw new UnauthorizedException('Token da comanda ausente');
        }

        const tokenHash = hashTokenComanda(tokenComanda);
        const dispositivo = await this.prisma.comandaDispositivo.findFirst({
            where: {
                comandaId,
                tokenHash,
                status: DispositivoStatus.aprovado,
                ativo: true,
            },
        });

        if (!dispositivo) {
            throw new UnauthorizedException('Token da comanda inválido');
        }

        if (exigirMaster && !dispositivo.master) {
            throw new BadRequestException('Ação permitida apenas para o master');
        }

        return dispositivo;
    }

    private formatarPedido(pedido: any) {
        return {
            id: pedido.id,
            idMesa: pedido.mesa?.numero ? String(pedido.mesa.numero) : pedido.idMesa,
            comandaId: pedido.comandaId ?? undefined,
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

    async criar(dto: CriarPedidoDto, restauranteId: string, tokenComanda?: string) {
        if (!restauranteId) {
            throw new BadRequestException('Restaurante não informado');
        }

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const mesa = await this.garantirMesa(dto.idMesa, restaurante.id);

        const comandaAtiva = await this.prisma.comanda.findFirst({
            where: {
                restauranteId: restaurante.id,
                mesaAtualId: mesa.id,
                status: ComandaStatus.aberta,
            },
        });

        if (comandaAtiva) {
            if (comandaAtiva.contaSolicitada) {
                throw new BadRequestException('Conta já solicitada para esta comanda');
            }
            await this.validarTokenComanda(comandaAtiva.id, tokenComanda, false);
        }

        const itensPreparados: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];
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

        const { pedidoCriado, mesaAtualizada, comandaCriada, tokenCriado } = await this.prisma.$transaction(async (tx) => {
            let comanda = comandaAtiva;
            let tokenGerado: string | undefined;

            if (!comanda) {
                let codigo = gerarCodigoComanda();
                for (let tentativa = 0; tentativa < 5; tentativa += 1) {
                    const existente = await tx.comanda.findUnique({ where: { codigo } });
                    if (!existente) break;
                    codigo = gerarCodigoComanda();
                }

                tokenGerado = gerarTokenComanda();
                const tokenHash = hashTokenComanda(tokenGerado);

                comanda = await tx.comanda.create({
                    data: {
                        codigo,
                        restauranteId: restaurante.id,
                        mesaAtualId: mesa.id,
                        status: ComandaStatus.aberta,
                        contaSolicitada: false,
                        dispositivos: {
                            create: {
                                tokenHash,
                                status: DispositivoStatus.aprovado,
                                master: true,
                                ativo: true,
                            },
                        },
                    },
                });
            }

            const mesaAtualizada = await tx.mesa.update({
                where: { id: mesa.id },
                data: {
                    ocupada: true,
                    ...(comandaAtiva ? {} : { contaSolicitada: false }),
                    ipsAtivos: { set: [] },
                },
            });

            const pedido = await tx.pedido.create({
                data: {
                    idMesa: mesa.id,
                    comandaId: comanda.id,
                    restauranteId: restaurante.id,
                    status: PedidoStatus.pendente,
                    encerrado: false,
                    itens: {
                        create: itensPreparados,
                    },
                },
                include: {
                    mesa: true,
                    itens: { include: { produto: true } },
                },
            });

            return {
                pedidoCriado: pedido,
                mesaAtualizada,
                comandaCriada: comanda,
                tokenCriado: tokenGerado,
            };
        });

        const pedidoFormatado = this.formatarPedido(pedidoCriado);

        this.pedidosGateway.emitirNovoPedido(restauranteId, pedidoFormatado);
        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesaAtualizada.id, {
            idMesa: mesaAtualizada.id,
            ocupada: mesaAtualizada.ocupada,
            contaSolicitada: mesaAtualizada.contaSolicitada,
            numeroMesa: mesaAtualizada.numero,
            comandaId: comandaCriada?.id,
        }, comandaCriada?.id);

        if (tokenCriado) {
            return {
                ...pedidoFormatado,
                comanda: {
                    id: comandaCriada?.id,
                    codigo: comandaCriada?.codigo,
                    token: tokenCriado,
                },
            };
        }

        return pedidoFormatado;
    }

    async editar(id: string, dto: EditarPedidoDto, restauranteId: string, tokenComanda?: string) {
        if (!restauranteId) throw new BadRequestException('Restaurante não informado');

        const pedidoExistente = await this.prisma.pedido.findUnique({
            where: { id },
            include: { mesa: true, comanda: true },
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

        let mesa = await this.garantirMesa(dto.idMesa, restaurante.id);
        if (pedidoExistente.comandaId) {
            await this.validarTokenComanda(pedidoExistente.comandaId, tokenComanda, false);
            const comandaAtual = await this.prisma.comanda.findUnique({ where: { id: pedidoExistente.comandaId } });
            if (comandaAtual?.mesaAtualId) {
                mesa = await this.garantirMesa(comandaAtual.mesaAtualId, restaurante.id);
            }
        }

        const itensPreparados: Prisma.ItemPedidoUncheckedCreateWithoutPedidoInput[] = [];
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
            pedidoFormatado,
            atualizado.comandaId ?? undefined,
        );

        return pedidoFormatado;
    }

    async statusPublico(id: string, restauranteId: string, tokenComanda?: string) {
        if (!restauranteId) throw new BadRequestException('Restaurante não informado');
        const pedido = await this.prisma.pedido.findUnique({
            where: { id },
            include: { mesa: true, itens: { include: { produto: true } } },
        });

        if (!pedido) throw new NotFoundException('Pedido não encontrado');
        if (pedido.restauranteId !== restauranteId) {
            throw new UnauthorizedException('Pedido pertence a outro restaurante');
        }

        if (pedido.comandaId) {
            await this.validarTokenComanda(pedido.comandaId, tokenComanda, false);
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

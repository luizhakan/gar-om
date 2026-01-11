import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComandaStatus, DispositivoStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { hashTokenComanda } from '../comandas/comanda.util';

@Injectable()
export class MesasService {
    constructor(private prisma: PrismaService, private pedidosGateway: PedidosGateway) {}

    // Método auxiliar de segurança para garantir a URL correta
    private obterUrlBaseSegura(baseUrlRecebida?: string): string {
        // Prioriza a URL recebida do frontend (window.location.origin)
        // Em produção, pode definir FRONTEND_URL no .env como fallback
        // Ex: FRONTEND_URL=https://meu-app-garcom.com
        const urlParaUsar = baseUrlRecebida || process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            // Sempre normaliza para apenas protocolo + host, ignorando path/query
            return new URL(urlParaUsar).origin;
        } catch {
            return 'http://localhost:5173';
        }
    }

    private async garantirMesa(idMesaRecebido: string, restauranteId: string) {
        const numeroMesa = Number(idMesaRecebido);
        const filtros: Prisma.MesaWhereInput[] = [{ id: idMesaRecebido }];
        if (Number.isInteger(numeroMesa)) {
            filtros.push({ numero: numeroMesa });
        }

        const mesaExistente = await this.prisma.mesa.findFirst({
            where: {
                restauranteId,
                OR: filtros,
            },
        });

        if (mesaExistente) return mesaExistente;

        throw new NotFoundException('Mesa não encontrada ou não pertence ao restaurante');
    }

    private async validarOuRegistrarIp(mesa: Prisma.MesaGetPayload<{}>, _ip?: string) {
        return mesa;
    }

    private async validarTokenComanda(comandaId: string, tokenComanda?: string) {
        if (!tokenComanda) {
            throw new BadRequestException('Token da comanda é obrigatório');
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
            throw new BadRequestException('Token da comanda inválido');
        }
    }

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.mesa.findMany({
            where: { restauranteId: restaurante.id },
            orderBy: { numero: 'asc' },
        });
    }

    // Usa a baseUrl recebida do frontend
    async adicionar(numero: number, baseUrl: string, restauranteId: string) {
        const baseUrlSegura = this.obterUrlBaseSegura(baseUrl);

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');
        
        const mesaExistente = await this.prisma.mesa.findFirst({
            where: { numero, restauranteId },
        });

        if (mesaExistente) {
            throw new BadRequestException(`A mesa com número ${numero} já existe neste restaurante.`);
        }

        const urlMesa = new URL(baseUrlSegura);
        urlMesa.pathname = `/mesa/${numero}`;
        urlMesa.searchParams.set('restauranteId', restauranteId);

        return this.prisma.mesa.create({
            data: {
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                contaSolicitada: false,
                restauranteId: restaurante.id,
            }
        });
    }

    async adicionarEmLote(inicio: number, fim: number, baseUrl: string, restauranteId: string) {
        if (inicio > fim) {
            throw new BadRequestException('O número inicial não pode ser maior que o final.');
        }

        const baseUrlSegura = this.obterUrlBaseSegura(baseUrl);

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const mesasExistentes = await this.prisma.mesa.findMany({
            where: {
                restauranteId,
                numero: { gte: inicio, lte: fim },
            },
            select: { numero: true },
        });

        if (mesasExistentes.length > 0) {
            const numeros = mesasExistentes.map(m => m.numero).join(', ');
            throw new BadRequestException(`As seguintes mesas já existem: ${numeros}`);
        }

        const novasMesas = [];
        for (let numero = inicio; numero <= fim; numero++) {
            const urlMesa = new URL(baseUrlSegura);
            urlMesa.pathname = `/mesa/${numero}`;
            urlMesa.searchParams.set('restauranteId', restauranteId);

            novasMesas.push({
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                contaSolicitada: false,
                restauranteId,
            });
        }

        await this.prisma.mesa.createMany({ data: novasMesas });

        return this.prisma.mesa.findMany({
            where: {
                restauranteId,
                numero: { gte: inicio, lte: fim },
            },
            orderBy: { numero: 'asc' },
        });
    }

    // Usa a baseUrl recebida do frontend
    async configurar(quantidade: number, baseUrl: string, restauranteId: string) {
        const baseUrlSegura = this.obterUrlBaseSegura(baseUrl);

        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        const pedidosExistentes = typeof this.prisma.pedido.count === 'function'
            ? await this.prisma.pedido.count({ where: { restauranteId } })
            : 0;

        if (pedidosExistentes > 0) {
            throw new BadRequestException(
                'Não é possível reconfigurar mesas enquanto existirem pedidos vinculados.'
            );
        }

        await this.prisma.mesa.deleteMany({ where: { restauranteId } });

        const mesas = Array.from({ length: quantidade }, (_, idx) => {
            const numero = idx + 1;
            const urlMesa = new URL(baseUrlSegura);
            urlMesa.pathname = `/mesa/${numero}`;
            urlMesa.searchParams.set('restauranteId', restauranteId);
            
            return {
                numero,
                codigoQr: urlMesa.toString(),
                ocupada: false,
                contaSolicitada: false,
                restauranteId,
            };
        });

        if (mesas.length) {
            await this.prisma.mesa.createMany({ data: mesas });
        }

        return this.prisma.mesa.findMany({
            where: { restauranteId },
            orderBy: { numero: 'asc' },
        });
    }

    async excluir(id: string, restauranteId: string) {
        const porId = await this.prisma.mesa.findFirst({ where: { id, restauranteId } });

        const numeroExtraido = (() => {
            const numericoDireto = Number(id);
            if (Number.isInteger(numericoDireto)) return numericoDireto;
            if (id.startsWith('mesa-')) {
                const possivelNumero = Number(id.replace('mesa-', ''));
                return Number.isInteger(possivelNumero) ? possivelNumero : undefined;
            }
            return undefined;
        })();

        const mesa =
            porId ??
            (numeroExtraido !== undefined
                ? await this.prisma.mesa.findFirst({
                    where: { numero: numeroExtraido, restauranteId },
                })
                : null);

        if (!mesa) {
            throw new NotFoundException('Mesa não encontrada ou não pertence a este restaurante.');
        }

        const pedidosVinculados = await this.prisma.pedido.count({
            where: { idMesa: mesa.id },
        });

        if (pedidosVinculados > 0) {
            throw new BadRequestException(
                'Mesa não pode ser excluída porque possui pedidos associados.'
            );
        }

        await this.prisma.mesa.delete({ where: { id: mesa.id } });
    }

    async solicitarConta(id: string, restauranteId: string, tokenComanda?: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        const mesaValidada = await this.validarOuRegistrarIp(mesa);

        const comanda = await this.prisma.comanda.findFirst({
            where: {
                restauranteId,
                mesaAtualId: mesaValidada.id,
                status: ComandaStatus.aberta,
            },
        });

        if (!comanda) {
            throw new BadRequestException('Mesa sem comanda ativa');
        }

        await this.validarTokenComanda(comanda.id, tokenComanda);

        const mesaAtualizada = await this.prisma.$transaction(async (tx) => {
            await tx.comanda.update({
                where: { id: comanda.id },
                data: { contaSolicitada: true },
            });

            return tx.mesa.update({
                where: { id: mesaValidada.id },
                data: { contaSolicitada: true, ocupada: true },
            });
        });

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesaValidada.id, {
            idMesa: mesaValidada.id,
            ocupada: mesaAtualizada.ocupada,
            contaSolicitada: mesaAtualizada.contaSolicitada,
            numeroMesa: mesaValidada.numero,
            comandaId: comanda.id,
        }, comanda.id);

        return mesaAtualizada;
    }

    async fechar(id: string, restauranteId: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        
        if (!mesa.ocupada) {
            throw new BadRequestException('Mesa já está livre');
        }

        const comanda = await this.prisma.comanda.findFirst({
            where: {
                restauranteId,
                mesaAtualId: mesa.id,
                status: ComandaStatus.aberta,
            },
        });

        if (comanda) {
            await this.prisma.$transaction(async (tx) => {
                await tx.pedido.updateMany({
                    where: {
                        comandaId: comanda.id,
                        encerrado: false,
                    },
                    data: { encerrado: true },
                });

                await tx.comanda.update({
                    where: { id: comanda.id },
                    data: { status: ComandaStatus.encerrada, contaSolicitada: false },
                });

                await tx.comandaDispositivo.updateMany({
                    where: { comandaId: comanda.id },
                    data: { ativo: false, master: false },
                });
            });
        } else {
            // Encerra todos os pedidos ativos desta mesa (fallback legado)
            await this.prisma.pedido.updateMany({
                where: {
                    idMesa: mesa.id,
                    restauranteId,
                    encerrado: false,
                },
                data: {
                    encerrado: true,
                },
            });
        }

        const mesaAtualizada = await this.prisma.mesa.update({
            where: { id: mesa.id },
            data: {
                ocupada: false,
                contaSolicitada: false,
                ipsAtivos: { set: [] },
            },
        });

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesa.id, {
            idMesa: mesa.id,
            ocupada: mesaAtualizada.ocupada,
            contaSolicitada: mesaAtualizada.contaSolicitada,
            numeroMesa: mesa.numero,
            comandaId: comanda?.id,
        }, comanda?.id);

        return mesaAtualizada;
    }

    async statusPublico(id: string, restauranteId: string, ip?: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        const mesaValidada = await this.validarOuRegistrarIp(mesa, ip);
        return {
            ocupada: mesaValidada.ocupada,
            contaSolicitada: mesaValidada.contaSolicitada,
        };
    }

    async obterComanda(id: string, restauranteId: string, ip?: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        const mesaValidada = await this.validarOuRegistrarIp(mesa, ip);

        const comanda = await this.prisma.comanda.findFirst({
            where: {
                restauranteId,
                mesaAtualId: mesaValidada.id,
                status: ComandaStatus.aberta,
            },
        });

        if (!comanda) {
            return [];
        }

        const pedidos = await this.prisma.pedido.findMany({
            where: {
                comandaId: comanda.id,
                restauranteId,
                encerrado: false,
            },
            orderBy: { dataCriacao: 'desc' },
            include: {
                itens: {
                    include: { produto: true },
                },
            },
        });

        return pedidos.map(pedido => ({
            id: pedido.id,
            idMesa: String(mesaValidada.numero),
            restauranteId: pedido.restauranteId,
            status: pedido.status,
            encerrado: pedido.encerrado,
            dataCriacao: pedido.dataCriacao,
            dataAtualizacao: pedido.dataAtualizacao,
            itens: pedido.itens.map(item => ({
                idProduto: item.produtoId,
                quantidade: item.quantidade,
                observacao: item.observacao,
                precoUnitario: item.precoUnitario,
                produto: {
                    id: item.produto.id,
                    nome: item.produto.nome,
                    descricao: item.produto.descricao,
                    preco: item.produto.preco,
                    idCategoria: item.produto.idCategoria,
                    disponivel: item.produto.disponivel,
                    imagemUrl: item.produto.imagemUrl,
                }
            })),
        }));
    }
}

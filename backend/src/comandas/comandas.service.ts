import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ComandaStatus, DispositivoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from '../pedidos/pedidos.gateway';
import { gerarTokenComanda, hashTokenComanda } from './comanda.util';

@Injectable()
export class ComandasService {
    constructor(
        private prisma: PrismaService,
        private pedidosGateway: PedidosGateway,
    ) {}

    private mapearComanda(
        comanda: Prisma.ComandaGetPayload<{ include: { mesaAtual: true } }>,
        dispositivoAtual?: { id: string; master: boolean },
    ) {
        return {
            id: comanda.id,
            codigo: comanda.codigo,
            status: comanda.status,
            contaSolicitada: comanda.contaSolicitada,
            mesaAtual: comanda.mesaAtual
                ? { id: comanda.mesaAtual.id, numero: comanda.mesaAtual.numero }
                : null,
            dispositivoAtual,
        };
    }

    private async validarDispositivo(
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
            throw new ForbiddenException('Ação disponível apenas para o master');
        }

        return dispositivo;
    }

    private async obterComandaAtiva(id: string, restauranteId: string) {
        const comanda = await this.prisma.comanda.findFirst({
            where: {
                id,
                restauranteId,
                status: ComandaStatus.aberta,
            },
            include: { mesaAtual: true },
        });

        if (!comanda) {
            throw new NotFoundException('Comanda não encontrada');
        }

        return comanda;
    }

    async solicitarAcesso(codigo: string, restauranteId: string, apelido?: string) {
        const comanda = await this.prisma.comanda.findFirst({
            where: {
                codigo,
                restauranteId,
                status: ComandaStatus.aberta,
            },
        });

        if (!comanda) {
            throw new NotFoundException('Comanda não encontrada ou encerrada');
        }

        const apelidoLimpo = (apelido ?? '').trim();

        const dispositivo = await this.prisma.comandaDispositivo.create({
            data: {
                comandaId: comanda.id,
                apelido: apelidoLimpo !== '' ? apelidoLimpo : undefined,
                status: DispositivoStatus.pendente,
                ativo: true,
            },
        });

        this.pedidosGateway.emitirAtualizacaoComanda(restauranteId, comanda.id);

        return { idDispositivo: dispositivo.id, codigoComanda: comanda.codigo };
    }

    async solicitarAcessoMesa(idMesa: string, restauranteId: string, apelido?: string) {
        const numeroMesa = Number(idMesa);
        const mesa = await this.prisma.mesa.findFirst({
            where: {
                restauranteId,
                OR: [
                    { id: idMesa },
                    ...(Number.isInteger(numeroMesa) ? [{ numero: numeroMesa }] : []),
                ],
            },
        });

        if (!mesa) {
            throw new NotFoundException('Mesa não encontrada');
        }

        const comanda = await this.prisma.comanda.findFirst({
            where: {
                mesaAtualId: mesa.id,
                restauranteId,
                status: ComandaStatus.aberta,
            },
        });

        if (!comanda) {
            throw new NotFoundException('Não há comanda aberta para esta mesa');
        }

        return this.solicitarAcesso(comanda.codigo, restauranteId, apelido);
    }

    async consultarSolicitacao(idDispositivo: string, codigo: string, restauranteId: string) {
        const dispositivo = await this.prisma.comandaDispositivo.findUnique({
            where: { id: idDispositivo },
            include: { comanda: true },
        });

        if (!dispositivo || dispositivo.comanda.codigo !== codigo || dispositivo.comanda.restauranteId !== restauranteId) {
            throw new NotFoundException('Solicitação não encontrada');
        }

        if (dispositivo.comanda.status !== ComandaStatus.aberta) {
            throw new BadRequestException('Comanda encerrada');
        }

        const statusResposta = dispositivo.status === DispositivoStatus.recusado
            ? DispositivoStatus.recusado
            : (dispositivo.ativo ? dispositivo.status : 'revogado');

        if (statusResposta !== DispositivoStatus.aprovado) {
            return { status: statusResposta };
        }

        if (!dispositivo.tokenHash) {
            const token = gerarTokenComanda();
            await this.prisma.comandaDispositivo.update({
                where: { id: dispositivo.id },
                data: { tokenHash: hashTokenComanda(token) },
            });

            return {
                status: DispositivoStatus.aprovado,
                token,
                comandaId: dispositivo.comandaId,
            };
        }

        return {
            status: DispositivoStatus.aprovado,
            comandaId: dispositivo.comandaId,
        };
    }

    async obterResumo(id: string, restauranteId: string, tokenComanda?: string) {
        const comanda = await this.obterComandaAtiva(id, restauranteId);
        const dispositivo = await this.validarDispositivo(comanda.id, tokenComanda, false);
        return this.mapearComanda(comanda, { id: dispositivo.id, master: dispositivo.master });
    }

    async obterPedidos(id: string, restauranteId: string, tokenComanda?: string) {
        const comanda = await this.obterComandaAtiva(id, restauranteId);
        await this.validarDispositivo(comanda.id, tokenComanda, false);

        const pedidos = await this.prisma.pedido.findMany({
            where: {
                comandaId: comanda.id,
                restauranteId,
                encerrado: false,
            },
            orderBy: { dataCriacao: 'desc' },
            include: {
                mesa: true,
                itens: {
                    include: { produto: true },
                },
            },
        });

        return pedidos.map(pedido => ({
            id: pedido.id,
            idMesa: pedido.mesa?.numero ? String(pedido.mesa.numero) : pedido.idMesa,
            restauranteId: pedido.restauranteId,
            status: pedido.status,
            encerrado: pedido.encerrado,
            dataCriacao: pedido.dataCriacao,
            dataAtualizacao: pedido.dataAtualizacao ?? undefined,
            itens: pedido.itens.map(item => ({
                idProduto: item.produtoId,
                quantidade: item.quantidade,
                observacao: item.observacao,
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
        }));
    }

    async listarDispositivos(id: string, restauranteId: string, tokenComanda?: string) {
        await this.validarDispositivo(id, tokenComanda, true);
        const comanda = await this.obterComandaAtiva(id, restauranteId);

        const dispositivos = await this.prisma.comandaDispositivo.findMany({
            where: { comandaId: comanda.id },
            orderBy: { createdAt: 'desc' },
        });

        return dispositivos.map(dispositivo => ({
            id: dispositivo.id,
            apelido: dispositivo.apelido,
            master: dispositivo.master,
            status: dispositivo.status === DispositivoStatus.recusado
                ? DispositivoStatus.recusado
                : (dispositivo.ativo ? dispositivo.status : 'revogado'),
            ativo: dispositivo.ativo,
            createdAt: dispositivo.createdAt,
        }));
    }

    async aprovarDispositivo(
        comandaId: string,
        restauranteId: string,
        idDispositivo: string,
        tokenComanda?: string,
    ) {
        await this.validarDispositivo(comandaId, tokenComanda, true);
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);

        const dispositivo = await this.prisma.comandaDispositivo.findFirst({
            where: { id: idDispositivo, comandaId: comanda.id },
        });

        if (!dispositivo) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        await this.prisma.comandaDispositivo.update({
            where: { id: dispositivo.id },
            data: { status: DispositivoStatus.aprovado, ativo: true },
        });

        return { id: dispositivo.id, status: DispositivoStatus.aprovado };
    }

    async recusarDispositivo(
        comandaId: string,
        restauranteId: string,
        idDispositivo: string,
        tokenComanda?: string,
    ) {
        await this.validarDispositivo(comandaId, tokenComanda, true);
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);

        const dispositivo = await this.prisma.comandaDispositivo.findFirst({
            where: { id: idDispositivo, comandaId: comanda.id },
        });

        if (!dispositivo) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        await this.prisma.comandaDispositivo.update({
            where: { id: dispositivo.id },
            data: { status: DispositivoStatus.recusado, ativo: false, master: false },
        });

        return { id: dispositivo.id, status: DispositivoStatus.recusado };
    }

    async revogarDispositivo(
        comandaId: string,
        restauranteId: string,
        idDispositivo: string,
        tokenComanda?: string,
    ) {
        await this.validarDispositivo(comandaId, tokenComanda, true);
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);

        const dispositivo = await this.prisma.comandaDispositivo.findFirst({
            where: { id: idDispositivo, comandaId: comanda.id },
        });

        if (!dispositivo) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        await this.prisma.comandaDispositivo.update({
            where: { id: dispositivo.id },
            data: { ativo: false, master: false },
        });

        return { id: dispositivo.id, status: 'revogado' };
    }

    async trocarMesa(
        comandaId: string,
        restauranteId: string,
        numeroMesa: number,
        tokenComanda?: string,
    ) {
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);
        await this.validarDispositivo(comanda.id, tokenComanda, true);

        if (comanda.contaSolicitada) {
            throw new BadRequestException('Conta solicitada. Troca de mesa bloqueada');
        }

        const mesaDestino = await this.prisma.mesa.findFirst({
            where: { numero: numeroMesa, restauranteId },
        });

        if (!mesaDestino) {
            throw new NotFoundException('Mesa de destino não encontrada');
        }

        if (mesaDestino.id === comanda.mesaAtualId) {
            throw new BadRequestException('Comanda já está nessa mesa');
        }

        if (mesaDestino.ocupada) {
            throw new BadRequestException('Mesa de destino já está ocupada');
        }

        const mesaAnteriorId = comanda.mesaAtualId;

        const resultado = await this.prisma.$transaction(async (tx) => {
            if (mesaAnteriorId) {
                await tx.mesa.update({
                    where: { id: mesaAnteriorId },
                    data: {
                        ocupada: false,
                        contaSolicitada: false,
                        ipsAtivos: { set: [] },
                    },
                });
            }

            await tx.mesa.update({
                where: { id: mesaDestino.id },
                data: {
                    ocupada: true,
                    contaSolicitada: false,
                    ipsAtivos: { set: [] },
                },
            });

            await tx.pedido.updateMany({
                where: { comandaId: comanda.id },
                data: { idMesa: mesaDestino.id },
            });

            return tx.comanda.update({
                where: { id: comanda.id },
                data: { mesaAtualId: mesaDestino.id },
                include: { mesaAtual: true },
            });
        });

        if (mesaAnteriorId) {
            this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesaAnteriorId, {
                idMesa: mesaAnteriorId,
                ocupada: false,
                contaSolicitada: false,
            });
        }

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, resultado.mesaAtualId ?? '', {
            idMesa: resultado.mesaAtualId ?? '',
            ocupada: true,
            contaSolicitada: false,
            numeroMesa: resultado.mesaAtual?.numero,
            comandaId: resultado.id,
        });

        return this.mapearComanda(resultado);
    }

    async solicitarConta(comandaId: string, restauranteId: string, tokenComanda?: string) {
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);
        await this.validarDispositivo(comanda.id, tokenComanda, false);

        if (comanda.contaSolicitada) {
            throw new BadRequestException('Conta já solicitada');
        }

        const mesaAtualId = comanda.mesaAtualId;
        if (!mesaAtualId) {
            throw new BadRequestException('Comanda sem mesa vinculada');
        }

        const atualizado = await this.prisma.$transaction(async (tx) => {
            await tx.mesa.update({
                where: { id: mesaAtualId },
                data: { contaSolicitada: true, ocupada: true },
            });

            return tx.comanda.update({
                where: { id: comanda.id },
                data: { contaSolicitada: true },
                include: { mesaAtual: true },
            });
        });

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesaAtualId, {
            idMesa: mesaAtualId,
            ocupada: true,
            contaSolicitada: true,
            numeroMesa: atualizado.mesaAtual?.numero,
            comandaId: atualizado.id,
        });

        return this.mapearComanda(atualizado);
    }

    async obterComandaPorMesa(mesaId: string, restauranteId: string) {
        const comanda = await this.prisma.comanda.findFirst({
            where: {
                restauranteId,
                mesaAtualId: mesaId,
                status: ComandaStatus.aberta,
            },
            include: { mesaAtual: true },
        });

        if (!comanda) {
            throw new NotFoundException('Comanda não encontrada para a mesa');
        }

        const dispositivos = await this.prisma.comandaDispositivo.findMany({
            where: { comandaId: comanda.id },
            orderBy: { createdAt: 'desc' },
        });

        return {
            ...this.mapearComanda(comanda),
            dispositivos: dispositivos.map(dispositivo => ({
                id: dispositivo.id,
                apelido: dispositivo.apelido,
                master: dispositivo.master,
                status: dispositivo.status === DispositivoStatus.recusado
                    ? DispositivoStatus.recusado
                    : (dispositivo.ativo ? dispositivo.status : 'revogado'),
                ativo: dispositivo.ativo,
                createdAt: dispositivo.createdAt,
            })),
        };
    }

    async adminVirarMaster(comandaId: string, restauranteId: string) {
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);

        await this.prisma.comandaDispositivo.updateMany({
            where: { comandaId: comanda.id, master: true },
            data: { master: false, ativo: false },
        });

        const apelidoAdmin = 'Painel (Admin)';
        const existente = await this.prisma.comandaDispositivo.findFirst({
            where: { comandaId: comanda.id, apelido: apelidoAdmin },
        });

        if (existente) {
            await this.prisma.comandaDispositivo.update({
                where: { id: existente.id },
                data: { master: true, status: DispositivoStatus.aprovado, ativo: true },
            });
        } else {
            await this.prisma.comandaDispositivo.create({
                data: {
                    comandaId: comanda.id,
                    apelido: apelidoAdmin,
                    master: true,
                    status: DispositivoStatus.aprovado,
                    ativo: true,
                },
            });
        }

        return { ok: true };
    }

    async adminDefinirMaster(comandaId: string, restauranteId: string, dispositivoId: string) {
        const comanda = await this.obterComandaAtiva(comandaId, restauranteId);

        await this.prisma.comandaDispositivo.updateMany({
            where: { comandaId: comanda.id },
            data: { master: false },
        });

        const dispositivo = await this.prisma.comandaDispositivo.findFirst({
            where: { id: dispositivoId, comandaId: comanda.id },
        });

        if (!dispositivo) {
            throw new NotFoundException('Dispositivo não encontrado');
        }

        await this.prisma.comandaDispositivo.update({
            where: { id: dispositivo.id },
            data: { master: true, status: DispositivoStatus.aprovado, ativo: true },
        });

        return { ok: true };
    }

    async adminEncerrar(comandaId: string, restauranteId: string) {
        const comanda = await this.prisma.comanda.findFirst({
            where: { id: comandaId, restauranteId },
            include: { mesaAtual: true },
        });

        if (!comanda) {
            throw new NotFoundException('Comanda não encontrada');
        }

        const mesaAtualId = comanda.mesaAtualId;

        await this.prisma.$transaction(async (tx) => {
            await tx.pedido.updateMany({
                where: { comandaId: comanda.id, encerrado: false },
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

            if (mesaAtualId) {
                await tx.mesa.update({
                    where: { id: mesaAtualId },
                    data: {
                        ocupada: false,
                        contaSolicitada: false,
                        ipsAtivos: { set: [] },
                    },
                });
            }
        });

        if (mesaAtualId) {
            this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesaAtualId, {
                idMesa: mesaAtualId,
                ocupada: false,
                contaSolicitada: false,
                numeroMesa: comanda.mesaAtual?.numero,
                comandaId: comanda.id,
            });
        }

        return { ok: true };
    }
}

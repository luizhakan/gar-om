import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { PedidosGateway } from '../pedidos/pedidos.gateway';

@Injectable()
export class MesasService {
    constructor(private prisma: PrismaService, private pedidosGateway: PedidosGateway) {}

    // Método auxiliar de segurança para garantir a URL correta
    private obterUrlBaseSegura(baseUrlRecebida?: string): string {
        // Em produção, defina a variável FRONTEND_URL no .env
        // Ex: FRONTEND_URL=https://meu-app-garcom.com
        const basePreferencial = process.env.FRONTEND_URL || baseUrlRecebida || 'http://localhost:5173';
        const fallback = process.env.FRONTEND_URL || 'http://localhost:5173';

        try {
            // Sempre normaliza para apenas protocolo + host, ignorando path/query
            return new URL(basePreferencial).origin;
        } catch {
            return new URL(fallback).origin;
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

    async listar(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        if (!restaurante) throw new NotFoundException('Restaurante não encontrado');

        return this.prisma.mesa.findMany({
            where: { restauranteId: restaurante.id },
            orderBy: { numero: 'asc' },
        });
    }

    // Correção: O parâmetro baseUrl recebido é ignorado por segurança
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

    // Correção: O parâmetro baseUrl recebido é ignorado por segurança
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

    async solicitarConta(id: string, restauranteId: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        if (!mesa.ocupada) {
            throw new BadRequestException('Mesa não está ocupada');
        }

        const mesaAtualizada = await this.prisma.mesa.update({
            where: { id: mesa.id },
            data: { contaSolicitada: true, ocupada: true },
        });

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesa.id, { 
            idMesa: mesa.id, 
            ocupada: mesaAtualizada.ocupada,
            contaSolicitada: mesaAtualizada.contaSolicitada,
            numeroMesa: mesa.numero,
        });

        return mesaAtualizada;
    }

    async fechar(id: string, restauranteId: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        
        if (!mesa.ocupada) {
            throw new BadRequestException('Mesa já está livre');
        }
        
        // Encerra todos os pedidos ativos desta mesa
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

        const mesaAtualizada = await this.prisma.mesa.update({
            where: { id: mesa.id },
            data: {
                ocupada: false,
                contaSolicitada: false,
            },
        });

        this.pedidosGateway.emitirAtualizacaoMesa(restauranteId, mesa.id, { 
            idMesa: mesa.id, 
            ocupada: mesaAtualizada.ocupada,
            contaSolicitada: mesaAtualizada.contaSolicitada,
            numeroMesa: mesa.numero,
        });

        return mesaAtualizada;
    }

    async statusPublico(id: string, restauranteId: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        return {
            ocupada: mesa.ocupada,
            contaSolicitada: mesa.contaSolicitada,
        };
    }

    async obterComanda(id: string, restauranteId: string) {
        const mesa = await this.garantirMesa(id, restauranteId);
        
        // Se a mesa não está ocupada, não há comanda ativa
        if (!mesa.ocupada) {
            return [];
        }

        // Retorna apenas pedidos NÃO encerrados
        const pedidos = await this.prisma.pedido.findMany({
            where: {
                idMesa: mesa.id,
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
            idMesa: String(mesa.numero),
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

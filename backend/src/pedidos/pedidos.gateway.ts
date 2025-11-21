// backend/src/pedidos/pedidos.gateway.ts

import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { validarToken } from '../auth/token.util';

const ADMIN_ROOM = 'restaurante_admin_cozinha_';
const MESA_ROOM = 'mesa_';

@Injectable()
@WebSocketGateway({
    // Configuração do CORS do WebSocket (ajuste para o seu frontend em produção)
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'],
    },
})
export class PedidosGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PedidosGateway.name);
    
    constructor(private prisma: PrismaService) {}
    
    // Injeta o servidor Socket.IO
    @WebSocketServer()
    server!: Server;

    // --- Métodos de Emissão de Eventos ---

    public emitirNovoPedido(restauranteId: string, payload: unknown) {
        // Envia para todos os admins/cozinheiros do restaurante
        this.server.to(ADMIN_ROOM + restauranteId).emit('novo-pedido', payload);
    }

    public emitirAtualizacaoPedido(restauranteId: string, idMesa: string, payload: unknown) {
        // 1. Para Cozinha/Admin
        this.server.to(ADMIN_ROOM + restauranteId).emit('status-atualizado', payload);
        // 2. Para Cliente da Mesa
        this.server.to(MESA_ROOM + idMesa).emit('status-comanda-atualizado', payload);
    }
    
    public emitirAtualizacaoMesa(restauranteId: string, idMesa: string, payload: unknown) {
        // Envia para Admin e para o Cliente da Mesa
        this.server.to(ADMIN_ROOM + restauranteId).emit('mesa-status-atualizado', payload);
        this.server.to(MESA_ROOM + idMesa).emit('mesa-status-atualizado', payload);
    }

    // --- Lógica de Conexão (Rooms) ---

    async handleConnection(client: Socket) {
        const restauranteId = client.handshake.query.restauranteId as string | undefined;
        const tipoUsuario = client.handshake.query.tipoUsuario as string | undefined;
        const token = (client.handshake.auth?.token ?? client.handshake.query.token) as string | undefined;
        const idMesaParam = client.handshake.query.idMesa as string | undefined;

        try {
            if (!restauranteId || !tipoUsuario) {
                throw new UnauthorizedException('Sessão inválida');
            }

            if (tipoUsuario === 'admin' || tipoUsuario === 'cozinha') {
                if (!token) throw new UnauthorizedException('Token ausente');
                const payload = validarToken(token);

                if (payload.restauranteId !== restauranteId) {
                    throw new ForbiddenException('Restaurante não corresponde ao token');
                }
                if (payload.role !== tipoUsuario) {
                    throw new ForbiddenException('Perfil não autorizado para o canal');
                }

                const room = ADMIN_ROOM + restauranteId;
                await client.join(room);
                this.logger.log(`[WS] ${tipoUsuario} conectado à sala: ${room}`);
                return;
            }

            // Clientes de mesa
            const idMesa = idMesaParam ?? (tipoUsuario.startsWith('mesa_') ? tipoUsuario.replace('mesa_', '') : undefined);
            if (!idMesa || tipoUsuario === 'anonimo') {
                throw new UnauthorizedException('Mesa ou sessão ausente');
            }

            const numeroMesa = Number(idMesa);
            const filtrosMesa: Prisma.MesaWhereInput[] = [{ id: idMesa }];
            if (Number.isInteger(numeroMesa)) {
                filtrosMesa.push({ numero: numeroMesa });
            }

            const mesa = await this.prisma.mesa.findFirst({
                where: {
                    restauranteId,
                    OR: filtrosMesa,
                },
            });

            if (!mesa) {
                throw new ForbiddenException('Mesa não pertence ao restaurante informado');
            }

            const room = MESA_ROOM + mesa.id;
            await client.join(room);
            this.logger.log(`[WS] Cliente de mesa conectado à sala: ${room}`);
        } catch (erro: any) {
            this.logger.warn(`[WS] Conexão recusada (${client.id}): ${erro?.message ?? 'erro desconhecido'}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`[WS] Cliente desconectado: ${client.id}`);
    }
}

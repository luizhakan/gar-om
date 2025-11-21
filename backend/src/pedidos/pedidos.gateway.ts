// backend/src/pedidos/pedidos.gateway.ts

import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Pedido } from '@prisma/client'; // Importe a tipagem real do Prisma

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
    
    // Injeta o servidor Socket.IO
    @WebSocketServer()
    server: Server;

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

    handleConnection(client: Socket) {
        const restauranteId = client.handshake.query.restauranteId as string;
        const tipoUsuario = client.handshake.query.tipoUsuario as string; // Ex: 'admin' ou 'mesa_1'
        
        if (!restauranteId || !tipoUsuario) {
             client.disconnect();
             return;
        }

        if (tipoUsuario === 'admin' || tipoUsuario === 'cozinha') {
            const room = ADMIN_ROOM + restauranteId;
            void client.join(room);
            this.logger.log(`[WS] Admin/Cozinha conectado à sala: ${room}`);
        } else if (tipoUsuario.startsWith('mesa_')) {
            const idMesa = tipoUsuario.replace('mesa_', '');
            const room = MESA_ROOM + idMesa;
            void client.join(room);
            this.logger.log(`[WS] Cliente mesa conectado à sala: ${room}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`[WS] Cliente desconectado: ${client.id}`);
    }
}
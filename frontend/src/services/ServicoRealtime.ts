// frontend/src/services/ServicoRealtime.ts (Novo arquivo - Lógica base)

import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { env } from '../config/env';
import { obterRestauranteId, obterTipoSessao } from '../utils/sessao';

const API_BASE = env.apiBaseUrl.replace('http', 'ws').replace(/\/$/, '');
let socket: Socket | null = null;

function obterQueryParams(): Record<string, string> {
    const restauranteId = obterRestauranteId();
    const tipo = obterTipoSessao();
    const idMesa = (/\/mesa\/([^/]+)/.exec(window.location.pathname))?.[1];

    if (!restauranteId) return {};

    let tipoUsuario: string;
    if (tipo === 'admin' || tipo === 'cozinha') {
        tipoUsuario = tipo;
    } else if (tipo === 'cliente' && idMesa) {
        tipoUsuario = `mesa_${idMesa}`; 
    } else {
        tipoUsuario = 'anonimo';
    }

    return {
        restauranteId,
        tipoUsuario, 
    };
}

export const ServicoRealtime = {
    conectar(): Socket {
        // Se já estiver conectado, retorna a instância existente
        if (socket?.connected) {
            return socket;
        }

        const queryParams = obterQueryParams();
        
        // Evita conexão se não houver dados de sessão
        if (!queryParams.restauranteId || !queryParams.tipoUsuario) {
            console.warn('[Realtime] Sessão não definida. Retornando mock de Socket.');
            // Retorna um mock de Socket para evitar erros de runtime
            return { connected: false, on: () => { /* no-op */ }, off: () => { /* no-op */ }, emit: () => { /* no-op */ } } as unknown as Socket;
        }
        
        socket = io(API_BASE, {
            query: queryParams,
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => { console.log('[WS] Conectado.'); });
        socket.on('disconnect', () => { console.log('[WS] Desconectado.'); });
        socket.on('connect_error', (err) => { console.error('[WS] Erro de conexão:', err.message); });

        return socket;
    },
    
    desconectar(): void {
        if (socket) {
            socket.offAny(); // Remove todos os listeners
            socket.disconnect();
            socket = null;
        }
    },
};
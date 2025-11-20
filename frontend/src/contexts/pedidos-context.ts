import { createContext } from 'react';
import type { Pedido } from '../types/Pedido';

export interface DadosContextoPedidos {
    pedidos: Pedido[];
    pedidosPendentes: Pedido[];
    adicionarPedido: (pedido: Omit<Pedido, 'id' | 'dataCriacao' | 'status'>) => Promise<void>;
    confirmarPedido: (idPedido: string) => Promise<void>;
    marcarComoPronto: (idPedido: string) => Promise<void>;
    novoPedidoRecebido: boolean;
    limparNotificacao: () => void;
}

export const ContextoPedidos = createContext<DadosContextoPedidos | undefined>(undefined);

import type { Pedido } from '../types/Pedido';
import { gerarIdAleatorio } from '../utils/formatadores';

const CHAVE_STORAGE = 'garom_pedidos';
const EVENTO_ATUALIZACAO = 'pedidos-atualizados';

function obterPedidosStorage(): Pedido[] {
    if (typeof window === 'undefined') return [];

    const dados = window.localStorage.getItem(CHAVE_STORAGE);
    if (!dados) return [];

    try {
        const parsed = JSON.parse(dados) as Pedido[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function salvarPedidosStorage(pedidos: Pedido[]) {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pedidos));
    window.dispatchEvent(new Event(EVENTO_ATUALIZACAO));
}

export const ServicoPedidos = {
    listar(): Pedido[] {
        return obterPedidosStorage();
    },

    criar(pedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao'>): Pedido {
        const pedidosAtuais = obterPedidosStorage();

        const novoPedido: Pedido = {
            ...pedido,
            id: gerarIdAleatorio(),
            status: 'pendente',
            dataCriacao: new Date().toISOString(),
        };

        salvarPedidosStorage([...pedidosAtuais, novoPedido]);

        return novoPedido;
    },

    atualizarStatus(idPedido: string, status: Pedido['status']): Pedido[] {
        const pedidosAtualizados = obterPedidosStorage().map(pedido =>
            pedido.id === idPedido
                ? { ...pedido, status, dataAtualizacao: new Date().toISOString() }
                : pedido
        );

        salvarPedidosStorage(pedidosAtualizados);
        return pedidosAtualizados;
    },

    assinarMudancas(callback: (pedidos: Pedido[]) => void) {
        const handler = () => callback(obterPedidosStorage());

        window.addEventListener('storage', handler);
        window.addEventListener(EVENTO_ATUALIZACAO, handler);

        // Emitir estado inicial
        handler();

        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener(EVENTO_ATUALIZACAO, handler);
        };
    }
};

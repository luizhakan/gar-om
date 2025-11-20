import { useContext } from 'react';
import { ContextoPedidos } from '../contexts/pedidos-context';

/**
 * Hook para acessar o contexto de pedidos.
 */
export function usePedidos() {
    const contexto = useContext(ContextoPedidos);

    if (!contexto) {
        throw new Error('usePedidos deve ser usado dentro de um ProvedorPedidos');
    }

    return contexto;
}

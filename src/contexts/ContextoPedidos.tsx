import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Pedido } from '../types/Pedido';
import { ServicoPedidos } from '../services/ServicoPedidos';

interface DadosContextoPedidos {
    pedidos: Pedido[];
    pedidosPendentes: Pedido[];
    adicionarPedido: (pedido: Omit<Pedido, 'id' | 'dataCriacao' | 'status'>) => void;
    confirmarPedido: (idPedido: string) => void;
    marcarComoPronto: (idPedido: string) => void;
    novoPedidoRecebido: boolean;
    limparNotificacao: () => void;
}

const ContextoPedidos = createContext<DadosContextoPedidos>({} as DadosContextoPedidos);

interface ProvedorPedidosProps {
    children: ReactNode;
}

export function ProvedorPedidos({ children }: ProvedorPedidosProps) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [novoPedidoRecebido, setNovoPedidoRecebido] = useState(false);

    useEffect(() => {
        const descadastrar = ServicoPedidos.assinarMudancas((novosPedidos) => {
            setPedidos((pedidosAntigos) => {
                // Detecta se há novos pedidos pendentes
                const pedidosPendentesNovos = novosPedidos.filter(p => p.status === 'pendente');
                const pedidosPendentesAntigos = pedidosAntigos.filter(p => p.status === 'pendente');
                
                if (pedidosPendentesNovos.length > pedidosPendentesAntigos.length) {
                    setNovoPedidoRecebido(true);
                }
                
                return novosPedidos;
            });
        });
        return () => descadastrar();
    }, []);

    function adicionarPedido(pedidoNovo: Omit<Pedido, 'id' | 'dataCriacao' | 'status'>) {
        const pedidoCriado = ServicoPedidos.criar(pedidoNovo);
        setPedidos(atual => [...atual, pedidoCriado]);
        setNovoPedidoRecebido(true);
    }

    function confirmarPedido(idPedido: string) {
        const atualizados = ServicoPedidos.atualizarStatus(idPedido, 'preparando');
        setPedidos(atualizados);
    }

    function marcarComoPronto(idPedido: string) {
        const atualizados = ServicoPedidos.atualizarStatus(idPedido, 'pronto');
        setPedidos(atualizados);
    }

    function limparNotificacao() {
        setNovoPedidoRecebido(false);
    }

    // Filtra apenas pedidos pendentes e em preparo
    const pedidosPendentes = pedidos.filter(
        p => p.status === 'pendente' || p.status === 'preparando'
    );

    return (
        <ContextoPedidos.Provider
            value={{
                pedidos,
                pedidosPendentes,
                adicionarPedido,
                confirmarPedido,
                marcarComoPronto,
                novoPedidoRecebido,
                limparNotificacao,
            }}
        >
            {children}
        </ContextoPedidos.Provider>
    );
}

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

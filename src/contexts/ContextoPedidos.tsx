import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Pedido } from '../types/Pedido';
import { gerarIdAleatorio } from '../utils/formatadores';

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

    function adicionarPedido(pedidoNovo: Omit<Pedido, 'id' | 'dataCriacao' | 'status'>) {
        const pedido: Pedido = {
            ...pedidoNovo,
            id: gerarIdAleatorio(),
            status: 'pendente',
            dataCriacao: new Date().toISOString(),
        };

        setPedidos(atual => [...atual, pedido]);
        setNovoPedidoRecebido(true);

        console.log('[DEBUG][adicionarPedido] Novo pedido recebido:', pedido);
    }

    function confirmarPedido(idPedido: string) {
        setPedidos(atual =>
            atual.map(pedido =>
                pedido.id === idPedido
                    ? { ...pedido, status: 'preparando' as const, dataAtualizacao: new Date().toISOString() }
                    : pedido
            )
        );
    }

    function marcarComoPronto(idPedido: string) {
        setPedidos(atual =>
            atual.map(pedido =>
                pedido.id === idPedido
                    ? { ...pedido, status: 'pronto' as const, dataAtualizacao: new Date().toISOString() }
                    : pedido
            )
        );
    }

    function limparNotificacao() {
        setNovoPedidoRecebido(false);
    }

    // Filtra apenas pedidos pendentes e em preparo
    const pedidosPendentes = pedidos.filter(
        p => p.status === 'pendente' || p.status === 'preparando'
    );

    // Simulação: Adicionar pedido de teste após 5 segundos (remover em produção)
    useEffect(() => {
        const timer = setTimeout(() => {
            adicionarPedido({
                idMesa: '5',
                itens: [
                    {
                        idProduto: '4',
                        quantidade: 2,
                        observacao: 'Sem cebola, por favor',
                    },
                    {
                        idProduto: '1',
                        quantidade: 1,
                    },
                ],
            });
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

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

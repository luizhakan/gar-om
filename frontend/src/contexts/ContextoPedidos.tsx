import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Pedido } from '../types/Pedido';
import { ServicoPedidos } from '../services/ServicoPedidos';
import { ContextoPedidos } from './pedidos-context';

interface ProvedorPedidosProps {
    children: ReactNode;
}

export function ProvedorPedidos({ children }: ProvedorPedidosProps) {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [novoPedidoRecebido, setNovoPedidoRecebido] = useState(false);
    const [versaoSessao, setVersaoSessao] = useState(0);

    useEffect(() => {
        const handler = () => { setVersaoSessao((valor) => valor + 1); };
        window.addEventListener('sessao-atualizada', handler);
        return () => { window.removeEventListener('sessao-atualizada', handler); };
    }, []);

    useEffect(() => {
        const descadastrar = ServicoPedidos.assinarMudancas((novosPedidos) => {
            setPedidos((pedidosAntigos) => {
                const pedidosPendentesNovos = novosPedidos.filter(p => p.status === 'pendente');
                const pedidosPendentesAntigos = pedidosAntigos.filter(p => p.status === 'pendente');
                
                if (pedidosPendentesNovos.length > pedidosPendentesAntigos.length) {
                    setNovoPedidoRecebido(true);
                }
                
                return novosPedidos;
            });
        });
        return () => { descadastrar(); };
    }, [versaoSessao]);

    async function adicionarPedido(pedidoNovo: Omit<Pedido, 'id' | 'dataCriacao' | 'status'>) {
        const pedidoCriado = await ServicoPedidos.criar(pedidoNovo);
        setPedidos(atual => [...atual, pedidoCriado]);
        setNovoPedidoRecebido(true);
    }

    async function confirmarPedido(idPedido: string) {
        try {
            const atualizados = await ServicoPedidos.atualizarStatus(idPedido, 'preparando');
            setPedidos(atualizados);
        } catch (erro) {
            console.error('[ContextoPedidos] Falha ao confirmar pedido', erro);
        }
    }

    async function marcarComoPronto(idPedido: string) {
        try {
            const atualizados = await ServicoPedidos.atualizarStatus(idPedido, 'pronto');
            setPedidos(atualizados);
        } catch (erro) {
            console.error('[ContextoPedidos] Falha ao marcar pedido como pronto', erro);
        }
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



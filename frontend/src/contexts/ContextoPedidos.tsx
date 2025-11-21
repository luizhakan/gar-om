import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Pedido } from '../types/Pedido';
import { ServicoPedidos } from '../services/ServicoPedidos';
import { ContextoPedidos } from './pedidos-context';
import { ServicoRealtime } from '../services/ServicoRealtime';
import { obterTipoSessao } from '../utils/sessao';

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
    // Carrega o estado inicial e configura o listener WS
    const carregarEstadoInicial = async () => {
        try {
            const lista = await ServicoPedidos.listar();
            setPedidos(lista);
        } catch (erro) {
            console.error('[ContextoPedidos] Erro ao carregar inicial', erro);
        }
    };
    
    // Verifica se a sessão é de Admin ou Cozinha para usar o WS
    const isRealtimeUser = obterTipoSessao() === 'admin' || obterTipoSessao() === 'cozinha';

    if (isRealtimeUser) {
        const socket = ServicoRealtime.conectar();
        void carregarEstadoInicial(); // Inicia com a lista completa

        // Handlers para eventos de WS
        const onRealtimeUpdate = (payload: Pedido) => {
            // Se o payload for um pedido completo (novo-pedido ou status-atualizado)
            setPedidos(atual => {
                // Tenta atualizar um existente
                const index = atual.findIndex(p => p.id === payload.id);
                if (index > -1) {
                    return atual.map((p, i) => i === index ? payload : p);
                }
                // Senão, é um novo pedido
                setNovoPedidoRecebido(true);
                return [payload, ...atual];
            });
        };
        
        // Handler para eventos de mesa (garantir consistência recarregando)
        const onMesaUpdate = () => {
             // Recarrega lista completa para refletir mudanças de mesa (fechamento, etc.)
            void carregarEstadoInicial();
        }

        socket.on('novo-pedido', onRealtimeUpdate);
        socket.on('status-atualizado', onRealtimeUpdate);
        socket.on('mesa-status-atualizado', onMesaUpdate); // Para Admin

        return () => {
            socket.off('novo-pedido', onRealtimeUpdate);
            socket.off('status-atualizado', onRealtimeUpdate);
            socket.off('mesa-status-atualizado', onMesaUpdate);
            ServicoRealtime.desconectar();
        };

    } else {
        // Lógica de fallback original (polling/storage) para clientes anônimos
        const descadastrar = ServicoPedidos.assinarMudancas((novosPedidos) => {
             // ... lógica original para detecção de mudança ...
        });
        return () => { descadastrar(); };
    }
}, [versaoSessao]); //

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


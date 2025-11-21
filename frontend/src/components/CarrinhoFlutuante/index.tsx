import { useEffect, useState } from 'react';
import { useCarrinho } from '../../hooks/useCarrinho';
import { formatarMoeda } from '../../utils/formatadores';
import styles from './styles.module.css';

interface PropsCarrinhoFlutuante {
    aoClicarRevisar: () => void;
}

export function CarrinhoFlutuante({ aoClicarRevisar }: PropsCarrinhoFlutuante) {
    const { quantidadeTotal, total } = useCarrinho();
    const [temPedidoAtivo, setTemPedidoAtivo] = useState(false);

    // Verifica se existe um pedido "pendente" ou "recente" no localStorage
    useEffect(() => {
        const verificarPedido = () => {
            const dados = window.localStorage.getItem('garcom_pedido_editavel');
            if (dados) {
                setTemPedidoAtivo(true);
            } else {
                setTemPedidoAtivo(false);
            }
        };

        verificarPedido();
        // Ouve eventos de storage/customizados para atualizar em tempo real
        window.addEventListener('storage', verificarPedido);
        // Intervalo curto para garantir atualização caso o evento falhe
        const intervalo = setInterval(verificarPedido, 2000);

        return () => {
            window.removeEventListener('storage', verificarPedido);
            clearInterval(intervalo);
        };
    }, []);

    // Se não tem itens E não tem pedido ativo, esconde.
    // Se tiver pedido ativo (mesmo com 0 itens no carrinho atual), MOSTRA o botão.
    if (quantidadeTotal === 0 && !temPedidoAtivo) {
        return null;
    }

    return (
        <div className={styles.container}>
            <button className={styles.botaoFlutuante} onClick={aoClicarRevisar}>
                <div className={styles.conteudo}>
                    {/* Se tiver itens, mostra a quantidade. Se não, mostra ícone de pedido */}
                    <div className={styles.badge}>
                        {quantidadeTotal > 0 ? quantidadeTotal : '📝'}
                    </div>

                    <div className={styles.info}>
                        <span className={styles.label}>
                            {quantidadeTotal > 0 ? 'Ver Carrinho' : 'Ver Meu Pedido'}
                        </span>
                        <span className={styles.total}>
                            {quantidadeTotal > 0 
                                ? formatarMoeda(total) 
                                : 'Acompanhar'}
                        </span>
                    </div>

                    <span className={styles.icone}>→</span>
                </div>
            </button>
        </div>
    );
}
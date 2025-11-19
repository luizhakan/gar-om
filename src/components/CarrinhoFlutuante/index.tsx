import { useCarrinho } from '../../contexts/ContextoCarrinho';
import { formatarMoeda } from '../../utils/formatadores';
import { Botao } from '../Botao';
import styles from './styles.module.css';

interface PropsCarrinhoFlutuante {
    aoClicarRevisar: () => void;
}

export function CarrinhoFlutuante({ aoClicarRevisar }: PropsCarrinhoFlutuante) {
    const { quantidadeTotal, total } = useCarrinho();

    if (quantidadeTotal === 0) {
        return null; // Não exibe se carrinho vazio
    }

    return (
        <div className={styles.container}>
            <button className={styles.botaoFlutuante} onClick={aoClicarRevisar}>
                <div className={styles.conteudo}>
                    <div className={styles.badge}>{quantidadeTotal}</div>

                    <div className={styles.info}>
                        <span className={styles.label}>Ver Comanda</span>
                        <span className={styles.total}>{formatarMoeda(total)}</span>
                    </div>

                    <span className={styles.icone}>→</span>
                </div>
            </button>
        </div>
    );
}

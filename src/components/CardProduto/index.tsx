import type { Produto } from '../../types/Produto';
import { formatarMoeda } from '../../utils/formatadores';
import styles from './styles.module.css';

interface PropsCardProduto {
    produto: Produto;
    aoClicar?: (produto: Produto) => void;
    exibirBotaoAdicionar?: boolean;
}

export function CardProduto({
    produto,
    aoClicar,
    exibirBotaoAdicionar = false
}: PropsCardProduto) {
    const handleClick = () => {
        if (aoClicar) {
            aoClicar(produto);
        }
    };

    return (
        <div
            className={`${styles.card} ${!produto.disponivel ? styles.indisponivel : ''}`}
            onClick={handleClick}
            role={aoClicar ? 'button' : undefined}
            tabIndex={aoClicar ? 0 : undefined}
        >
            <div className={styles.conteudo}>
                <h3 className={styles.nome}>{produto.nome}</h3>

                {produto.descricao && (
                    <p className={styles.descricao}>{produto.descricao}</p>
                )}

                <div className={styles.rodape}>
                    <span className={styles.preco}>
                        {formatarMoeda(produto.preco)}
                    </span>

                    {exibirBotaoAdicionar && produto.disponivel && (
                        <button className={styles.botaoAdicionar} onClick={handleClick}>
                            +
                        </button>
                    )}

                    {!produto.disponivel && (
                        <span className={styles.badgeIndisponivel}>Indisponível</span>
                    )}
                </div>
            </div>
        </div>
    );
}

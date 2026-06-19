import type { Produto } from '../../types/Produto';
import { formatarMoeda } from '../../utils/formatadores';
import styles from './styles.module.css';

interface PropsCardProduto {
    produto: Produto;
    aoClicar?: (produto: Produto) => void;
    exibirBotaoAdicionar?: boolean;
    quantidadeNoCarrinho?: number;
}

export function CardProduto({
    produto,
    aoClicar,
    exibirBotaoAdicionar = false,
    quantidadeNoCarrinho = 0,
}: PropsCardProduto) {
    const handleClick = () => {
        if (aoClicar && produto.disponivel) aoClicar(produto);
    };

    const temImagem = Boolean(produto.imagemUrl);

    return (
        <div
            className={`${styles.card} ${!produto.disponivel ? styles.indisponivel : ''} ${temImagem ? styles.comImagem : ''}`}
            onClick={handleClick}
            role={aoClicar ? 'button' : undefined}
            tabIndex={aoClicar ? 0 : undefined}
            onKeyDown={e => e.key === 'Enter' && handleClick()}
        >
            {temImagem && (
                <div className={styles.imagemWrap}>
                    <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className={styles.imagem}
                        loading="lazy"
                    />
                    {!produto.disponivel && (
                        <span className={styles.overlayIndisponivel}>Indisponível</span>
                    )}
                </div>
            )}

            <div className={styles.conteudo}>
                <h3 className={styles.nome}>{produto.nome}</h3>

                {(produto.descricao ?? '').trim().length > 0 && (
                    <p className={styles.descricao}>{produto.descricao}</p>
                )}

                <div className={styles.rodape}>
                    <span className={styles.preco}>{formatarMoeda(produto.preco)}</span>

                    {exibirBotaoAdicionar && produto.disponivel && (
                        <button
                            className={`${styles.botaoAdicionar} ${quantidadeNoCarrinho > 0 ? styles.comItens : ''}`}
                            onClick={e => { e.stopPropagation(); handleClick(); }}
                            aria-label={`Adicionar ${produto.nome}`}
                        >
                            {quantidadeNoCarrinho > 0 ? (
                                <span className={styles.qtdBadge}>{quantidadeNoCarrinho}</span>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            )}
                        </button>
                    )}

                    {!produto.disponivel && !temImagem && (
                        <span className={styles.badgeIndisponivel}>Indisponível</span>
                    )}
                </div>
            </div>
        </div>
    );
}

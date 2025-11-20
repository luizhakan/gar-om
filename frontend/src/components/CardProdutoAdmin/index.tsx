import type { Produto } from '../../types/Produto';
import { formatarMoeda } from '../../utils/formatadores';
import { Botao } from '../Botao';
import styles from './styles.module.css';

interface CardProdutoAdminProps {
    produto: Produto;
    categoria: string;
    onEditar: () => void;
    onRemover: () => void;
    onAlternarDisponivel: () => void;
}

export function CardProdutoAdmin({
    produto,
    categoria,
    onEditar,
    onRemover,
    onAlternarDisponivel
}: CardProdutoAdminProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div>
                    <p className={styles.categoria}>{categoria}</p>
                    <h3 className={styles.nome}>{produto.nome}</h3>
                </div>
                <span className={produto.disponivel ? styles.tagDisponivel : styles.tagIndisponivel}>
                    {produto.disponivel ? 'Disponível' : 'Indisponível'}
                </span>
            </div>

            {(produto.descricao ?? '').trim().length > 0 && (
                <p className={styles.descricao}>{produto.descricao}</p>
            )}

            <div className={styles.footer}>
                <div>
                    <p className={styles.precoRotulo}>Preço</p>
                    <p className={styles.preco}>{formatarMoeda(produto.preco)}</p>
                </div>
                <div className={styles.acoes}>
                    <Botao variante="secundario" tamanho="pequeno" onClick={() => { onEditar(); }}>
                        ✏️ Editar
                    </Botao>
                    <Botao variante="perigo" tamanho="pequeno" onClick={() => { onRemover(); }}>
                        🗑️ Remover
                    </Botao>
                    <Botao tamanho="pequeno" onClick={() => { onAlternarDisponivel(); }}>
                        {produto.disponivel ? 'Pausar' : 'Reativar'}
                    </Botao>
                </div>
            </div>
        </div>
    );
}

import type { Produto } from '../../types/Produto';
import type { Categoria } from '../../types/Categoria';
import { CardProduto } from '../CardProduto';
import styles from './styles.module.css';

interface PropsListaProdutos {
    produtos: Produto[];
    categorias: Categoria[];
    aoClicarProduto: (produto: Produto) => void;
}

export function ListaProdutos({ produtos, categorias, aoClicarProduto }: PropsListaProdutos) {
    // Agrupa produtos por categoria
    const produtosPorCategoria = categorias.map(categoria => ({
        categoria,
        produtos: produtos.filter(p => p.idCategoria === categoria.id)
    })).filter(grupo => grupo.produtos.length > 0);

    return (
        <div className={styles.container}>
            {produtosPorCategoria.map(({ categoria, produtos }) => (
                <section key={categoria.id} className={styles.secaoCategoria}>
                    <h2 className={styles.tituloCategoria}>{categoria.nome}</h2>

                    <div className={styles.grade}>
                        {produtos.map(produto => (
                            <CardProduto
                                key={produto.id}
                                produto={produto}
                                aoClicar={aoClicarProduto}
                                exibirBotaoAdicionar
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

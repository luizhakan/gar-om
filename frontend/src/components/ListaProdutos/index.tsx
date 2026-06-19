import { useEffect, useRef } from 'react';
import type { Produto } from '../../types/Produto';
import type { Categoria } from '../../types/Categoria';
import { CardProduto } from '../CardProduto';
import styles from './styles.module.css';

interface PropsListaProdutos {
    produtos: Produto[];
    categorias: Categoria[];
    aoClicarProduto: (produto: Produto) => void;
    quantidadesCarrinho?: Record<string, number>;
    aoMudarCategoria?: (categoriaId: string) => void;
}

export function ListaProdutos({
    produtos,
    categorias,
    aoClicarProduto,
    quantidadesCarrinho = {},
    aoMudarCategoria,
}: PropsListaProdutos) {
    const containerRef = useRef<HTMLDivElement>(null);

    const produtosPorCategoria = categorias
        .map(categoria => ({
            categoria,
            produtos: produtos.filter(p => p.idCategoria === categoria.id),
        }))
        .filter(grupo => grupo.produtos.length > 0);

    // IntersectionObserver: notifica qual categoria está visível no topo
    useEffect(() => {
        if (!aoMudarCategoria || produtosPorCategoria.length === 0) return;

        const sections = produtosPorCategoria.map(({ categoria }) =>
            document.getElementById(`cat-${categoria.id}`)
        ).filter(Boolean) as HTMLElement[];

        if (sections.length === 0) return;

        const observer = new IntersectionObserver(
            entries => {
                // Pega a seção com o topo mais próximo do topo da tela (que ainda está visível)
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    const id = visible[0].target.getAttribute('data-categoria-id');
                    if (id) aoMudarCategoria(id);
                }
            },
            {
                threshold: 0,
                rootMargin: '-130px 0px -55% 0px',
            }
        );

        sections.forEach(el => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [produtosPorCategoria.length, aoMudarCategoria]);

    return (
        <div className={styles.container} ref={containerRef}>
            {produtosPorCategoria.map(({ categoria, produtos: prods }) => (
                <section
                    key={categoria.id}
                    id={`cat-${categoria.id}`}
                    data-categoria-id={categoria.id}
                    className={styles.secaoCategoria}
                >
                    <h2 className={styles.tituloCategoria}>{categoria.nome}</h2>

                    <div className={styles.grade}>
                        {prods.map(produto => (
                            <CardProduto
                                key={produto.id}
                                produto={produto}
                                aoClicar={aoClicarProduto}
                                exibirBotaoAdicionar
                                quantidadeNoCarrinho={quantidadesCarrinho[produto.id] ?? 0}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

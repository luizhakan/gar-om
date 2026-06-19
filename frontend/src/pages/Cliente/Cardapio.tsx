import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../hooks/useCarrinho';
import { ListaProdutos } from '../../components/ListaProdutos';
import { CarrinhoFlutuante } from '../../components/CarrinhoFlutuante';
import { ModalObservacao } from '../../components/ModalObservacao';
import type { Produto } from '../../types/Produto';
import type { Categoria } from '../../types/Categoria';
import { definirSessao } from '../../utils/sessao';
import { ServicoProdutos } from '../../services/ServicoProdutos';
import { ServicoCategorias } from '../../services/ServicoCategorias';
import styles from './styles.module.css';

export function CardapioCliente() {
    const { idMesa } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { adicionarItem, itens } = useCarrinho();

    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');
    const tabBarRef = useRef<HTMLDivElement>(null);
    const idMesaSeguro = idMesa ?? '';

    // Mapa idProduto → quantidade no carrinho
    const quantidadesCarrinho = useMemo(
        () => Object.fromEntries(itens.map(item => [item.idProduto, item.quantidade])),
        [itens]
    );

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (restauranteId) definirSessao(restauranteId, 'cliente');
    }, [searchParams]);

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (!restauranteId) {
            setErro('Restaurante não informado no QRCode.');
            setCarregando(false);
            return;
        }

        void (async () => {
            try {
                const [cats, prods] = await Promise.all([
                    ServicoCategorias.listar(restauranteId),
                    ServicoProdutos.listar(restauranteId),
                ]);
                setCategorias(cats);
                setProdutos(prods.filter(p => p.disponivel || !p.disponivel)); // mostra todos, card trata indisponível
                setErro(null);
            } catch (e) {
                console.error('[Cardapio] Erro ao carregar', e);
                setErro('Não foi possível carregar o cardápio.');
            } finally {
                setCarregando(false);
            }
        })();
    }, [searchParams]);

    // Rola o tab ativo para o centro da tab bar
    useEffect(() => {
        if (!categoriaAtiva || !tabBarRef.current) return;
        const tab = tabBarRef.current.querySelector<HTMLElement>(`[data-tab="${categoriaAtiva}"]`);
        tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [categoriaAtiva]);

    function scrollParaCategoria(categoriaId: string) {
        const el = document.getElementById(`cat-${categoriaId}`);
        if (!el) return;
        // scrollIntoView com offset manual para não esconder atrás do header
        const y = el.getBoundingClientRect().top + window.scrollY - 148;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    const handleSelecionarProduto = (produto: Produto) => setProdutoSelecionado(produto);

    const handleConfirmarObservacao = (observacao: string) => {
        if (!produtoSelecionado) return;
        adicionarItem(produtoSelecionado, observacao);
        setProdutoSelecionado(null);
    };

    const handleRevisarPedido = () => {
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${idMesaSeguro}/revisar${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    if (carregando) {
        return (
            <div className={styles.container}>
                <div className={styles.carregando}>
                    <span className={styles.carregandoPulso} />
                    Carregando cardápio…
                </div>
            </div>
        );
    }

    if (erro) {
        return (
            <div className={styles.container}>
                <div className={styles.erroEstado}>
                    <p>Ops — {erro}</p>
                </div>
            </div>
        );
    }

    const categoriasComProdutos = categorias.filter(cat =>
        produtos.some(p => p.idCategoria === cat.id)
    );

    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <div className="container">
                    <div className={styles.cabecalhoTopo}>
                        <div>
                            <p className={styles.mesaLabel}>Mesa</p>
                            <h1 className={styles.titulo}>{idMesaSeguro}</h1>
                        </div>
                        <p className={styles.subtitulo}>
                            {produtos.filter(p => p.disponivel).length} itens disponíveis
                        </p>
                    </div>
                </div>

                {/* Tab bar de categorias */}
                {categoriasComProdutos.length > 1 && (
                    <div className={styles.tabBarWrap} ref={tabBarRef}>
                        <div className={styles.tabBar}>
                            {categoriasComProdutos.map(cat => (
                                <button
                                    key={cat.id}
                                    data-tab={cat.id}
                                    className={`${styles.tabPill} ${categoriaAtiva === cat.id ? styles.tabPillAtiva : ''}`}
                                    onClick={() => scrollParaCategoria(cat.id)}
                                >
                                    {cat.nome}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className={`container ${styles.conteudoPrincipal}`}>
                <ListaProdutos
                    produtos={produtos}
                    categorias={categorias}
                    aoClicarProduto={handleSelecionarProduto}
                    quantidadesCarrinho={quantidadesCarrinho}
                    aoMudarCategoria={setCategoriaAtiva}
                />
            </main>

            <CarrinhoFlutuante aoClicarRevisar={handleRevisarPedido} />

            <ModalObservacao
                aberto={!!produtoSelecionado}
                produto={produtoSelecionado}
                aoConfirmar={handleConfirmarObservacao}
                aoCancelar={() => setProdutoSelecionado(null)}
            />
        </div>
    );
}

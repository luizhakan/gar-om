import { useEffect, useState } from 'react';
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
    const { adicionarItem } = useCarrinho();

    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const idMesaSeguro = idMesa ?? '';

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (restauranteId !== null && restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [searchParams]);

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (restauranteId === null || restauranteId === '') {
            setErro('Restaurante não informado no QRCode.');
            setCarregando(false);
            return;
        }

        const carregar = async () => {
            try {
                const [cats, prods] = await Promise.all([
                    ServicoCategorias.listar(),
                    ServicoProdutos.listar(),
                ]);
                setCategorias(cats);
                setProdutos(prods.filter(p => p.disponivel));
                setErro(null);
            } catch (e) {
                console.error('[Cardapio] Erro ao carregar', e);
                setErro('Não foi possível carregar o cardápio.');
            } finally {
                setCarregando(false);
            }
        };

        void carregar();
    }, [searchParams]);

    const handleSelecionarProduto = (produto: Produto) => {
        setProdutoSelecionado(produto);
    };

    const handleConfirmarObservacao = (observacao: string) => {
        if (produtoSelecionado === null) return;

        adicionarItem(produtoSelecionado, observacao);
        setProdutoSelecionado(null);
    };

    const handleFecharModal = () => {
        setProdutoSelecionado(null);
    };

    const handleRevisarPedido = () => {
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${idMesaSeguro}/revisar${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    if (carregando) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ paddingTop: '3rem' }}>
                    <p>Carregando cardápio...</p>
                </div>
            </div>
        );
    }

    if (erro !== null) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ paddingTop: '3rem' }}>
                    <h1>Ops</h1>
                    <p>{erro}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <div className="container">
                    <h1 className={styles.titulo}>Mesa {idMesaSeguro}</h1>
                    <p className={styles.subtitulo}>Escolha seus itens</p>
                    <div className={styles.painelAcoes}>
                        <span>🌙 Modo escuro otimizado para restaurante</span>
                        <span>🧭 Toque no item para adicionar rápido</span>
                        <span>🔎 Use busca do navegador para filtrar</span>
                    </div>
                </div>
            </header>

            <main className={`container ${styles.conteudoPrincipal}`}>
                <ListaProdutos
                    produtos={produtos}
                    categorias={categorias}
                    aoClicarProduto={handleSelecionarProduto}
                />
            </main>

            <CarrinhoFlutuante aoClicarRevisar={handleRevisarPedido} />

            <ModalObservacao
                aberto={!!produtoSelecionado}
                produto={produtoSelecionado}
                aoConfirmar={handleConfirmarObservacao}
                aoCancelar={handleFecharModal}
            />
        </div>
    );
}

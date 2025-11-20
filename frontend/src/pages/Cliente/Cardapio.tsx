import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../contexts/ContextoCarrinho';
import { ListaProdutos } from '../../components/ListaProdutos';
import { CarrinhoFlutuante } from '../../components/CarrinhoFlutuante';
import { ModalObservacao } from '../../components/ModalObservacao';
import { produtosMock, categoriasMock } from '../../mocks/cardapio';
import type { Produto } from '../../types/Produto';
import { definirSessao } from '../../utils/sessao';
import styles from './styles.module.css';

export function CardapioCliente() {
    const { idMesa } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { adicionarItem } = useCarrinho();

    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (restauranteId) {
            definirSessao(restauranteId, 'cliente');
        }
    }, [searchParams]);

    const handleSelecionarProduto = (produto: Produto) => {
        setProdutoSelecionado(produto);
    };

    const handleConfirmarObservacao = (observacao: string) => {
        if (!produtoSelecionado) return;

        adicionarItem(produtoSelecionado, observacao);
        setProdutoSelecionado(null);
    };

    const handleFecharModal = () => {
        setProdutoSelecionado(null);
    };

    const handleRevisarPedido = () => {
        const sufixoBusca = searchParams.toString();
        navigate(`/mesa/${idMesa}/revisar${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <div className="container">
                    <h1 className={styles.titulo}>Mesa {idMesa}</h1>
                    <p className={styles.subtitulo}>Escolha seus itens</p>
                </div>
            </header>

            <main className={`container ${styles.conteudoPrincipal}`}>
                <ListaProdutos
                    produtos={produtosMock}
                    categorias={categoriasMock}
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

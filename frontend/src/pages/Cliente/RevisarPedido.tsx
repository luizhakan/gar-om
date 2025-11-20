import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../hooks/useCarrinho';
import { ControleQuantidade } from '../../components/ControleQuantidade';
import { Botao } from '../../components/Botao';
import { formatarMoeda } from '../../utils/formatadores';
import { ServicoPedidos } from '../../services/ServicoPedidos';
import { definirSessao } from '../../utils/sessao';
import styles from './RevisarPedido.module.css';

export function RevisarPedido() {
    const { idMesa } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        itens,
        atualizarQuantidade,
        removerItem,
        total,
        limparCarrinho
    } = useCarrinho();
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    useEffect(() => {
        const restauranteId = searchParams.get('restauranteId');
        if (restauranteId !== null && restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [searchParams]);

    const handleVoltarCardapio = () => {
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    const handleEnviarPedido = async () => {
        if (itens.length === 0) return;

        try {
            await ServicoPedidos.criar({
                idMesa: idMesa ?? '0',
                itens: itens.map(item => ({
                    idProduto: item.idProduto,
                    quantidade: item.quantidade,
                    observacao: item.observacao,
                })),
            });

            setMensagemSucesso('Pedido enviado para a cozinha! 🎉');
            limparCarrinho();
            const sufixoBusca = searchParams.toString();
            setTimeout(() => { void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`); }, 600);
        } catch (erro) {
            console.error('[RevisarPedido] Falha ao enviar pedido', erro);
        }
    };

    if (itens.length === 0) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h1>Sua comanda está vazia</h1>
                    <p style={{ color: 'var(--cor-texto-secundario)', marginBottom: '2rem' }}>
                        Adicione itens do cardápio para fazer seu pedido
                    </p>
                    <Botao onClick={handleVoltarCardapio}>
                        Voltar ao Cardápio
                    </Botao>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.cabecalho}>
                <div className="container">
                    <button className={styles.botaoVoltar} onClick={handleVoltarCardapio}>
                        ← Voltar
                    </button>
                    <h1 className={styles.titulo}>Revisar Pedido</h1>
                    <p className={styles.subtitulo}>Mesa {idMesa}</p>
                </div>
            </header>

            <main className={`container ${styles.conteudoPrincipal}`}>
                <div className={styles.listaItens}>
                    {itens.map(item => (
                        <div key={item.idProduto} className={styles.itemPedido}>
                            <div className={styles.infoItem}>
                                <h3 className={styles.nomeItem}>{item.produto.nome}</h3>
                                {(item.observacao ?? '') !== '' && (
                                    <p className={styles.observacao}>Obs: {item.observacao}</p>
                                )}
                                <p className={styles.precoUnitario}>
                                    {formatarMoeda(item.produto.preco)} cada
                                </p>
                            </div>

                            <div className={styles.acoesItem}>
                                <ControleQuantidade
                                    quantidade={item.quantidade}
                                    aoAlterar={(novaQtd) => { atualizarQuantidade(item.idProduto, novaQtd); }}
                                    minimo={0}
                                />

                                <button
                                    className={styles.botaoRemover}
                                    onClick={() => { removerItem(item.idProduto); }}
                                    aria-label="Remover item"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className={styles.subtotalItem}>
                                {formatarMoeda(item.produto.preco * item.quantidade)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.resumo}>
                    <div className={styles.linhaTotal}>
                        <span className={styles.labelTotal}>Total</span>
                        <span className={styles.valorTotal}>{formatarMoeda(total)}</span>
                    </div>

                    {mensagemSucesso && (
                        <p className={styles.mensagemSucesso}>{mensagemSucesso}</p>
                    )}

                    <Botao
                        variante="primario"
                        tamanho="grande"
                        onClick={() => { void handleEnviarPedido(); }}
                        className={styles.botaoEnviar}
                    >
                        Enviar para Cozinha 🍳
                    </Botao>
                </div>
            </main>
        </div>
    );
}

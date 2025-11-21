import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../hooks/useCarrinho';
import { ControleQuantidade } from '../../components/ControleQuantidade';
import { Botao } from '../../components/Botao';
import { formatarMoeda } from '../../utils/formatadores';
import { ServicoPedidos } from '../../services/ServicoPedidos';
import { ServicoMesas } from '../../services/ServicoMesas';
import { definirSessao } from '../../utils/sessao';
import styles from './RevisarPedido.module.css';
import type { ItemPedido, Pedido } from '../../types/Pedido';
import { ServicoRealtime } from '../../services/ServicoRealtime'; // <-- NOVO

// Constantes
const CHAVE_PEDIDO_EDITAVEL = 'garcom_pedido_editavel';

// Define estrutura para itens agregados na comanda
interface ItemResumo {
    idProduto: string;
    nome: string;
    quantidade: number;
    total: number;
    precoUnitario: number;
}

export function RevisarPedido() {
    const { idMesa } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        itens: itensCarrinho,
        atualizarQuantidade,
        removerItem,
        total: totalCarrinho,
        limparCarrinho
    } = useCarrinho();
    
    const [mensagemSucesso, setMensagemSucesso] = useState('');
    const restauranteId = searchParams.get('restauranteId');
    
    const [comanda, setComanda] = useState<Pedido[]>([]);
    const [contaSolicitada, setContaSolicitada] = useState(false);
    const [carregando, setCarregando] = useState(true);

    // Verificação de sessão encerrada (se o usuário ainda tem dados locais de uma sessão fechada)
    useEffect(() => {
        const verificarSessaoAtiva = async () => {
            const dadosLocais = window.localStorage.getItem(CHAVE_PEDIDO_EDITAVEL);
            if (dadosLocais) {
                try {
                    const parsed = JSON.parse(dadosLocais) as { idPedido: string };
                    const status = await ServicoPedidos.obterStatusPublico(parsed.idPedido);
                    
                    // Se o pedido salvo localmente foi marcado como ENCERRADO pelo admin, limpamos o storage
                    if (status.encerrado) {
                        console.log('[RevisarPedido] Sessão anterior encerrada. Limpando dados locais.');
                        window.localStorage.removeItem(CHAVE_PEDIDO_EDITAVEL);
                    }
                } catch (e) {
                    // Se deu erro (ex: 404), assume que não existe mais ou não é válido
                    window.localStorage.removeItem(CHAVE_PEDIDO_EDITAVEL);
                }
            }
        };
        
        void verificarSessaoAtiva();
    }, []);

    // Soma do que já foi pedido (backend - comanda ativa)
    const itensComandaAgrupados = comanda.reduce<ItemResumo[]>((acc, pedido) => {
        pedido.itens.forEach(item => {
            const existente = acc.find(i => i.idProduto === item.idProduto);
            const preco = item.precoUnitario ?? item.produto?.preco ?? 0;
            const nome = item.produto?.nome ?? 'Item desconhecido';
            
            if (existente) {
                existente.quantidade += item.quantidade;
                existente.total += preco * item.quantidade;
            } else {
                acc.push({
                    idProduto: item.idProduto,
                    nome,
                    quantidade: item.quantidade,
                    precoUnitario: preco,
                    total: preco * item.quantidade
                });
            }
        });
        return acc;
    }, []);

    const totalComanda = itensComandaAgrupados.reduce((acc, item) => acc + item.total, 0);
    const totalGeral = totalCarrinho + totalComanda;

    useEffect(() => {
        if (restauranteId !== null && restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [restauranteId]);

    // Carregar comanda do servidor e status da mesa
useEffect(() => {
    if (!idMesa || !restauranteId) return;

    // Função para carregar dados (usada na inicialização e nos eventos WS)
    const carregarDados = async () => {
        try {
            // 1. Status da Mesa
            const status = await ServicoMesas.obterStatusPublico(idMesa);
            setContaSolicitada(status.contaSolicitada);

            // 2. Comanda
            const pedidosAnteriores = await ServicoMesas.obterComanda(idMesa);
            setComanda(pedidosAnteriores);
            setCarregando(false);

        } catch (erro) {
            console.error('[RevisarPedido] Erro ao carregar dados', erro);
            setCarregando(false);
        }
    };

    // --- Lógica WebSocket (NOVA) ---
    const socket = ServicoRealtime.conectar();
    void carregarDados(); // Carrega estado inicial

    const onComandaAtualizada = () => {
         console.log('[WS] Evento de comanda/mesa recebido, recarregando...');
         void carregarDados(); // Recarrega os dados completos
    };

    // Assina os eventos específicos desta mesa
    socket.on('status-comanda-atualizado', onComandaAtualizada); // Se o status de um pedido mudar
    socket.on('mesa-status-atualizado', onComandaAtualizada); // Se a conta for solicitada/mesa fechada

    // Cleanup: remove listeners e desconecta, substituindo o clearInterval
    return () => {
        socket.off('status-comanda-atualizado', onComandaAtualizada);
        socket.off('mesa-status-atualizado', onComandaAtualizada);
        ServicoRealtime.desconectar();
    };
}, [idMesa, restauranteId]); //

    const handleVoltarCardapio = () => {
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    const handleEnviarPedido = async () => {
        if (itensCarrinho.length === 0) return;
        
        const payload = {
            idMesa: idMesa ?? '0',
            itens: itensCarrinho.map(item => ({
                idProduto: item.idProduto,
                quantidade: item.quantidade,
                observacao: item.observacao,
            })),
        };

        try {
            const pedidoCriado = await ServicoPedidos.criar(payload);
            
            // Salva localmente para referência de edição rápida (se necessário)
            const info = {
                idPedido: pedidoCriado.id,
                restauranteId: restauranteId ?? '',
                inicioJanela: Date.now(),
            };
            window.localStorage.setItem(CHAVE_PEDIDO_EDITAVEL, JSON.stringify(info));

            setMensagemSucesso('Pedido enviado para a cozinha! 🍳');
            limparCarrinho();
            
            // Recarrega a comanda imediatamente
            if (idMesa) {
                const atualizada = await ServicoMesas.obterComanda(idMesa);
                setComanda(atualizada);
            }

            const sufixoBusca = searchParams.toString();
            setTimeout(() => { 
                void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`); 
            }, 2000);
        } catch (erro) {
            console.error('[RevisarPedido] Falha ao enviar', erro);
            alert('Erro ao processar pedido. Tente novamente.');
        }
    };

    const handleSolicitarConta = async () => {
        if (!restauranteId || !idMesa) return;
        try {
            await ServicoMesas.solicitarConta(idMesa);
            setContaSolicitada(true);
            setMensagemSucesso('Conta solicitada. Aguarde o garçom.');
        } catch (erro) {
            console.error('[RevisarPedido] Erro conta', erro);
        }
    };

    if (carregando) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <p>Carregando sua comanda...</p>
                </div>
            </div>
        );
    }

    const carrinhoVazio = itensCarrinho.length === 0;
    const comandaVazia = itensComandaAgrupados.length === 0;

    if (carrinhoVazio && comandaVazia && !mensagemSucesso) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h1>Sua comanda está vazia</h1>
                    <p style={{ color: 'var(--cor-texto-secundario)', marginBottom: '2rem' }}>
                        Que tal pedir algo delicioso?
                    </p>
                    <Botao onClick={handleVoltarCardapio}>Voltar ao Cardápio</Botao>
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
                    <h1 className={styles.titulo}>
                        {carrinhoVazio ? 'Minha Comanda' : 'Confirmar Pedido'}
                    </h1>
                    <p className={styles.subtitulo}>Mesa {idMesa}</p>
                </div>
            </header>

            <main className={`container ${styles.conteudoPrincipal}`}>
                
                {/* SEÇÃO 1: NOVOS ITENS (CARRINHO) */}
                {!carrinhoVazio && (
                    <div className={styles.secaoNovoPedido}>
                        <h2 className={styles.tituloSecao}>Novo Pedido (Ainda não enviado)</h2>
                        <div className={styles.listaItens}>
                            {itensCarrinho.map(item => (
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
                        <div className={styles.totalCarrinhoLinha}>
                            <span>Subtotal novos itens:</span>
                            <strong>{formatarMoeda(totalCarrinho)}</strong>
                        </div>
                    </div>
                )}

                {/* SEÇÃO 2: HISTÓRICO (COMANDA ATIVA) */}
                {!comandaVazia && (
                    <div className={styles.secaoComanda}>
                        <h2 className={styles.tituloSecao}>Já solicitados (Na cozinha/Entregues)</h2>
                        <div className={styles.listaResumo}>
                            {itensComandaAgrupados.map(item => (
                                <div key={item.idProduto} className={styles.itemResumo}>
                                    <span className={styles.qtdResumo}>{item.quantidade}x</span>
                                    <span className={styles.nomeResumo}>{item.nome}</span>
                                    <span className={styles.totalResumo}>{formatarMoeda(item.total)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.statusRecentes}>
                            {comanda.slice(0, 3).map(p => (
                                <div key={p.id} className={styles.badgeStatus} data-status={p.status}>
                                    Pedido das {new Date(p.dataCriacao).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: 
                                    <strong> {p.status === 'pendente' ? 'Aguardando' : p.status === 'preparando' ? 'Preparando' : 'Pronto'}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RODAPÉ COM TOTAL GERAL E AÇÕES */}
                <div className={styles.resumo}>
                    <div className={styles.linhaTotal}>
                        <span className={styles.labelTotal}>Total da Mesa</span>
                        <span className={styles.valorTotal}>{formatarMoeda(totalGeral)}</span>
                    </div>

                    {mensagemSucesso && (
                        <p className={styles.mensagemSucesso} style={{color: 'var(--cor-sucesso)', fontWeight: 'bold', textAlign: 'center'}}>
                            {mensagemSucesso}
                        </p>
                    )}

                    {!carrinhoVazio && (
                        <Botao
                            variante="primario"
                            tamanho="grande"
                            onClick={() => { void handleEnviarPedido(); }}
                            className={styles.botaoEnviar}
                            disabled={contaSolicitada}
                        >
                            Enviar Pedido para Cozinha 🍳
                        </Botao>
                    )}

                    <Botao
                        variante="secundario"
                        tamanho="grande"
                        onClick={() => { void handleSolicitarConta(); }}
                        disabled={contaSolicitada || comandaVazia}
                    >
                        {contaSolicitada ? 'Conta Solicitada (Aguarde)' : 'Fechar Conta 🧾'}
                    </Botao>
                </div>
            </main>
        </div>
    );
}
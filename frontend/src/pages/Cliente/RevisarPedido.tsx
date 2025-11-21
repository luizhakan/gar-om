import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../hooks/useCarrinho';
import { ControleQuantidade } from '../../components/ControleQuantidade';
import { Botao } from '../../components/Botao';
import { formatarMoeda } from '../../utils/formatadores';
import { ServicoPedidos } from '../../services/ServicoPedidos';
import { ServicoMesas } from '../../services/ServicoMesas';
import { definirSessao } from '../../utils/sessao';
import styles from './RevisarPedido.module.css';
import type { StatusPedido } from '../../types/Pedido';

const TEMPO_EDICAO_MS = 90_000;
const CHAVE_PEDIDO_EDITAVEL = 'garcom_pedido_editavel';
const CHAVE_CONTA_SOLICITADA = 'garcom_conta_solicitada';

interface PedidoEditavelInfo {
    idPedido: string;
    restauranteId: string;
    inicioJanela: number;
}

function carregarPedidoEditavel(restauranteId?: string | null): PedidoEditavelInfo | null {
    if (typeof window === 'undefined') return null;
    const bruto = window.localStorage.getItem(CHAVE_PEDIDO_EDITAVEL);
    if (!bruto) return null;
    try {
        const parsed = JSON.parse(bruto) as PedidoEditavelInfo;
        if (!restauranteId || parsed.restauranteId !== restauranteId) return null;
        const expirou = Date.now() - parsed.inicioJanela > TEMPO_EDICAO_MS;
        return expirou ? null : parsed;
    } catch {
        return null;
    }
}

function carregarContaSolicitada(restauranteId?: string | null, idMesa?: string | null): boolean {
    if (typeof window === 'undefined') return false;
    if (!restauranteId || !idMesa) return false;
    const chave = `${CHAVE_CONTA_SOLICITADA}:${restauranteId}:${idMesa}`;
    const valor = window.localStorage.getItem(chave);
    return valor === '1';
}

export function RevisarPedido() {
    const { idMesa } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        itens,
        atualizarQuantidade,
        removerItem,
        total
    } = useCarrinho();
    const [mensagemSucesso, setMensagemSucesso] = useState('');
    const restauranteId = searchParams.get('restauranteId');
    const [pedidoEditavel, setPedidoEditavel] = useState<PedidoEditavelInfo | null>(() =>
        carregarPedidoEditavel(restauranteId)
    );
    const [tempoRestanteMs, setTempoRestanteMs] = useState<number>(() => {
        const info = carregarPedidoEditavel(restauranteId);
        return info ? Math.max(0, TEMPO_EDICAO_MS - (Date.now() - info.inicioJanela)) : 0;
    });
    const [statusPedido, setStatusPedido] = useState<StatusPedido | undefined>(undefined);
    const [contaSolicitada, setContaSolicitada] = useState<boolean>(() =>
        carregarContaSolicitada(restauranteId, idMesa ?? null)
    );
    const [resumoPedido, setResumoPedido] = useState<typeof itens | undefined>(undefined);
    const ultimoSnapshotRef = useRef<string>('');
    const janelaEdicaoAtiva = useMemo(() => {
        if (!pedidoEditavel) return false;
        return tempoRestanteMs > 0;
    }, [pedidoEditavel, tempoRestanteMs]);
    const editarHabilitado = pedidoEditavel !== null && janelaEdicaoAtiva && !contaSolicitada;
    const podeEnviar = !contaSolicitada && (pedidoEditavel ? editarHabilitado : true);
    const somenteLeitura = (pedidoEditavel !== null && !editarHabilitado) || (!editarHabilitado && (resumoPedido?.length ?? 0) > 0);
    const itensVisiveis = resumoPedido ?? itens;

    useEffect(() => {
        if (restauranteId !== null && restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [restauranteId]);

    useEffect(() => {
        let ativo = true;
        const restauranteParam = restauranteId ?? '';
        if (restauranteParam === '' || (idMesa ?? '') === '') return;

        const chave = `${CHAVE_CONTA_SOLICITADA}:${restauranteParam}:${idMesa ?? ''}`;

        const sincronizarStatusMesa = async () => {
            try {
                const status = await ServicoMesas.obterStatusPublico(idMesa ?? '');
                if (!ativo) return;
                setContaSolicitada(status.contaSolicitada);
                if (!status.contaSolicitada) {
                    window.localStorage.removeItem(chave);
                }
            } catch (erro) {
                console.error('[RevisarPedido] Falha ao consultar status da mesa', erro);
            }
        };

        void sincronizarStatusMesa();
        return () => { ativo = false; };
    }, [idMesa, restauranteId]);

    useEffect(() => {
        const atualizar = () => {
            const info = carregarPedidoEditavel(restauranteId);
            if (!info) {
                setPedidoEditavel(null);
                setTempoRestanteMs(0);
                setStatusPedido(undefined);
                setResumoPedido(undefined);
                return;
            }
            const restante = Math.max(0, TEMPO_EDICAO_MS - (Date.now() - info.inicioJanela));
            setPedidoEditavel(info);
            setTempoRestanteMs(restante);
            if (restante <= 0) {
                setTempoRestanteMs(0);
            }
        };

        atualizar();
        const intervalo = window.setInterval(atualizar, 1000);
        return () => { window.clearInterval(intervalo); };
    }, [restauranteId]);

    useEffect(() => {
        if (!pedidoEditavel) return;

        let ativo = true;

        const consultar = async () => {
            try {
                const status = await ServicoPedidos.obterStatusPublico(pedidoEditavel.idPedido);
                if (!ativo) return;
                const snapshot = `${status.status}|${status.itens
                    .map(item => `${item.idProduto}-${item.quantidade}-${item.observacao ?? ''}`)
                    .join('|')}`;
                if (snapshot === ultimoSnapshotRef.current) return;
                ultimoSnapshotRef.current = snapshot;
                setStatusPedido(status.status);
                setResumoPedido(status.itens.map(item => ({
                    idProduto: item.idProduto,
                    produto: item.produto,
                    quantidade: item.quantidade,
                    observacao: item.observacao,
                    precoUnitario: item.precoUnitario ?? item.produto?.preco,
                })));
                if (status.status === 'pronto') {
                    setTempoRestanteMs(0);
                    return;
                }
            } catch (erro) {
                console.error('[RevisarPedido] Falha ao consultar status', erro);
            }
        };

        void consultar();
        const intervalo = window.setInterval(consultar, 5000);
        return () => {
            ativo = false;
            window.clearInterval(intervalo);
        };
    }, [pedidoEditavel]);

    const handleVoltarCardapio = () => {
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    const handleEnviarPedido = async () => {
        if (itens.length === 0) return;
        const restauranteParam = restauranteId ?? '';
        if (restauranteParam === '') {
            console.error('[RevisarPedido] RestauranteId ausente na URL');
            return;
        }
        if (!podeEnviar) return;

        const payload = {
            idMesa: idMesa ?? '0',
            itens: itens.map(item => ({
                idProduto: item.idProduto,
                quantidade: item.quantidade,
                observacao: item.observacao,
            })),
        };

        try {
            if (pedidoEditavel && editarHabilitado) {
                const atualizado = await ServicoPedidos.editar(pedidoEditavel.idPedido, payload);
                setStatusPedido(atualizado.status);
                setResumoPedido(atualizado.itens.map(item => ({
                    idProduto: item.idProduto,
                    produto: item.produto,
                    quantidade: item.quantidade,
                    observacao: item.observacao,
                    precoUnitario: item.precoUnitario ?? item.produto?.preco,
                })));
            } else {
                const criado = await ServicoPedidos.criar(payload);
                const info: PedidoEditavelInfo = {
                    idPedido: criado.id,
                    restauranteId: restauranteParam,
                    inicioJanela: Date.now(),
                };
                setPedidoEditavel(info);
                setStatusPedido(criado.status);
                setResumoPedido(criado.itens.map(item => ({
                    idProduto: item.idProduto,
                    produto: item.produto,
                    quantidade: item.quantidade,
                    observacao: item.observacao,
                    precoUnitario: item.precoUnitario ?? item.produto?.preco,
                })));
                window.localStorage.setItem(CHAVE_PEDIDO_EDITAVEL, JSON.stringify(info));
            }

            setMensagemSucesso(pedidoEditavel && editarHabilitado ? 'Pedido atualizado! 🎉' : 'Pedido enviado para a cozinha! 🎉');
            const sufixoBusca = searchParams.toString();
            setTimeout(() => { void navigate(`/mesa/${idMesa ?? ''}${sufixoBusca ? `?${sufixoBusca}` : ''}`); }, 600);
        } catch (erro) {
            console.error('[RevisarPedido] Falha ao enviar pedido', erro);
        }
    };

    const handleSolicitarConta = async () => {
        const restauranteParam = restauranteId ?? '';
        if (restauranteParam === '' || (idMesa ?? '') === '') return;
        try {
            await ServicoMesas.solicitarConta(idMesa ?? '');
            setContaSolicitada(true);
            const chave = `${CHAVE_CONTA_SOLICITADA}:${restauranteParam}:${idMesa ?? ''}`;
            window.localStorage.setItem(chave, '1');
            setMensagemSucesso('Conta solicitada. Aguarde o garçom.');
        } catch (erro) {
            console.error('[RevisarPedido] Falha ao solicitar conta', erro);
        }
    };

    if (itensVisiveis.length === 0) {
        return (
            <div className={styles.container}>
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    <h1>Sua comanda</h1>
                    <p style={{ color: 'var(--cor-texto-secundario)', marginBottom: '2rem' }}>
                        Nenhum item registrado ainda.
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
                    {itensVisiveis.map(item => (
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

                            {somenteLeitura ? (
                                <div className={styles.acoesItem}>
                                    <span className={styles.quantidadeResumo}>{item.quantidade}x</span>
                                </div>
                            ) : (
                                <div className={styles.acoesItem}>
                                    <ControleQuantidade
                                        quantidade={item.quantidade}
                                        aoAlterar={(novaQtd) => {
                                            if (!podeEnviar) return;
                                            atualizarQuantidade(item.idProduto, novaQtd);
                                        }}
                                        minimo={0}
                                    />

                                    <button
                                        className={styles.botaoRemover}
                                        onClick={() => {
                                            if (!podeEnviar) return;
                                            removerItem(item.idProduto);
                                        }}
                                        aria-label="Remover item"
                                        disabled={!podeEnviar}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}

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
                    {pedidoEditavel && tempoRestanteMs > 0 && (
                        <p className={styles.mensagemSucesso}>
                            Você pode editar este pedido por mais {Math.ceil(tempoRestanteMs / 1000)}s.
                        </p>
                    )}
                    {statusPedido && (
                        <p className={styles.statusPedido}>
                            Status do pedido: <strong>{statusPedido === 'pendente' ? 'Recebido' : statusPedido === 'preparando' ? 'Em preparo' : 'Pronto'}</strong>
                        </p>
                    )}
                    {contaSolicitada && (
                        <p className={styles.statusPedido}>
                            Conta solicitada. Um atendente virá até você.
                        </p>
                    )}

                    {resumoPedido && resumoPedido.length > 0 && (
                        <div className={styles.resumoPedido}>
                            <p className={styles.resumoTitulo}>Sua comanda</p>
                            <ul className={styles.resumoLista}>
                                {resumoPedido.map(item => (
                                    <li key={item.idProduto} className={styles.resumoItem}>
                                        <span>{item.quantidade}x {item.produto?.nome ?? 'Item'}</span>
                                        <span>{formatarMoeda((item.precoUnitario ?? item.produto?.preco ?? 0) * item.quantidade)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className={styles.resumoTotalLinha}>
                                <span>Total consumido</span>
                                <strong>{formatarMoeda(resumoPedido.reduce((soma, item) => (
                                    soma + (item.precoUnitario ?? item.produto?.preco ?? 0) * item.quantidade
                                ), 0))}</strong>
                            </div>
                        </div>
                    )}

                    {!somenteLeitura && (
                        <Botao
                            variante="primario"
                            tamanho="grande"
                            onClick={() => { void handleEnviarPedido(); }}
                            className={styles.botaoEnviar}
                            disabled={!podeEnviar}
                        >
                            {pedidoEditavel ? 'Atualizar pedido' : 'Enviar para Cozinha 🍳'}
                        </Botao>
                    )}

                    <Botao
                        variante="secundario"
                        tamanho="grande"
                        onClick={() => { void handleSolicitarConta(); }}
                        disabled={contaSolicitada}
                    >
                        {contaSolicitada ? 'Conta solicitada' : 'Pedir conta'}
                    </Botao>
                </div>
            </main>
        </div>
    );
}

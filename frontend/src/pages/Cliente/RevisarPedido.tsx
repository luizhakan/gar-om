import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCarrinho } from '../../hooks/useCarrinho';
import { ControleQuantidade } from '../../components/ControleQuantidade';
import { Botao } from '../../components/Botao';
import { formatarMoeda } from '../../utils/formatadores';
import { ServicoPedidos } from '../../services/ServicoPedidos';
import { ServicoComandas } from '../../services/ServicoComandas';
import { definirSessao, limparComandaSessao, obterCodigoComanda, obterComandaId } from '../../utils/sessao';
import styles from './RevisarPedido.module.css';
import type { Pedido } from '../../types/Pedido';
import { ServicoRealtime } from '../../services/ServicoRealtime'; // <-- NOVO
import type { ComandaResumo, DispositivoComanda } from '../../types/Comanda';

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
    const [comandaInfo, setComandaInfo] = useState<ComandaResumo | null>(null);
    const [dispositivos, setDispositivos] = useState<DispositivoComanda[]>([]);
    const [mostrarModalTroca, setMostrarModalTroca] = useState(false);
    const [mostrarModalSolicitacoes, setMostrarModalSolicitacoes] = useState(false);
    const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false);
    const [erroSolicitacoes, setErroSolicitacoes] = useState('');
    const [versaoSessao, setVersaoSessao] = useState(0);
    const [numeroMesaTroca, setNumeroMesaTroca] = useState<number | ''>(1);
    const [trocandoMesa, setTrocandoMesa] = useState(false);
    const [erroTrocaMesa, setErroTrocaMesa] = useState('');

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

    useEffect(() => {
        const handler = () => { setVersaoSessao((valor) => valor + 1); };
        window.addEventListener('sessao-atualizada', handler);
        return () => { window.removeEventListener('sessao-atualizada', handler); };
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
    const numeroMesaAtual = comandaInfo?.mesaAtual?.numero ?? idMesa ?? '';
    const codigoComanda = comandaInfo?.codigo ?? obterCodigoComanda();
    const ehMaster = comandaInfo?.dispositivoAtual?.master ?? false;
    const pendentes = dispositivos.filter(dispositivo => dispositivo.status === 'pendente');
    const linkComanda = (codigoComanda && restauranteId && typeof window !== 'undefined')
        ? `${window.location.origin}/comanda/entrar?codigo=${encodeURIComponent(codigoComanda)}&restauranteId=${encodeURIComponent(restauranteId)}`
        : '';
    const qrComanda = linkComanda !== ''
        ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(linkComanda)}`
        : '';

    useEffect(() => {
        if (restauranteId !== null && restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [restauranteId]);

    const carregarDados = useCallback(async () => {
        if (!restauranteId) return;
        setCarregando(true);

        try {
            const comandaId = obterComandaId();
            if (comandaId) {
                const resumo = await ServicoComandas.obterResumo(comandaId);
                setComandaInfo(resumo);
                setContaSolicitada(resumo.contaSolicitada);

                const pedidosAnteriores = await ServicoComandas.obterPedidos(comandaId);
                setComanda(pedidosAnteriores);
            } else {
                setComandaInfo(null);
                setContaSolicitada(false);
                setComanda([]);
            }
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao carregar dados', erro);
            limparComandaSessao();
            setComandaInfo(null);
            setContaSolicitada(false);
            setComanda([]);
        } finally {
            setCarregando(false);
        }
    }, [restauranteId]);

    // Carregar comanda do servidor e status da mesa
    useEffect(() => {
        if (!idMesa || !restauranteId) return;

        const socket = ServicoRealtime.conectar();
        void carregarDados();

        const onComandaAtualizada = () => {
            console.log('[WS] Evento de comanda/mesa recebido, recarregando...');
            void carregarDados();
        };

        socket.on('status-comanda-atualizado', onComandaAtualizada);
        socket.on('mesa-status-atualizado', onComandaAtualizada);

        return () => {
            socket.off('status-comanda-atualizado', onComandaAtualizada);
            socket.off('mesa-status-atualizado', onComandaAtualizada);
            ServicoRealtime.desconectar();
        };
    }, [carregarDados, idMesa, restauranteId, versaoSessao]);

    const handleVoltarCardapio = () => {
        const numeroMesaAtual = comandaInfo?.mesaAtual?.numero ?? idMesa ?? '';
        const sufixoBusca = searchParams.toString();
        void navigate(`/mesa/${String(numeroMesaAtual)}${sufixoBusca ? `?${sufixoBusca}` : ''}`);
    };

    const handleEnviarPedido = async () => {
        if (itensCarrinho.length === 0) return;
        
        const numeroMesaAtual = comandaInfo?.mesaAtual?.numero ?? idMesa ?? '0';
        const payload = {
            idMesa: String(numeroMesaAtual),
            itens: itensCarrinho.map(item => ({
                idProduto: item.idProduto,
                quantidade: item.quantidade,
                observacao: item.observacao,
            })),
        };

        try {
            const pedidoCriado = await ServicoPedidos.criar(payload, restauranteId ?? undefined);
            
            // Salva localmente para referência de edição rápida (se necessário)
            const info = {
                idPedido: pedidoCriado.id,
                restauranteId: restauranteId ?? '',
                inicioJanela: Date.now(),
            };
            window.localStorage.setItem(CHAVE_PEDIDO_EDITAVEL, JSON.stringify(info));

            setMensagemSucesso('Pedido enviado para a cozinha! 🍳');
            limparCarrinho();
            
            await carregarDados();

            const sufixoBusca = searchParams.toString();
            setTimeout(() => { 
                void navigate(`/mesa/${String(numeroMesaAtual)}${sufixoBusca ? `?${sufixoBusca}` : ''}`); 
            }, 2000);
        } catch (erro) {
            console.error('[RevisarPedido] Falha ao enviar', erro);
            const mensagem = erro instanceof Error && erro.message !== ''
                ? erro.message
                : 'Erro ao processar pedido. Tente novamente.';
            alert(mensagem);
        }
    };

    const handleSolicitarConta = async () => {
        const comandaId = obterComandaId();
        if (!restauranteId || !comandaId) return;
        try {
            await ServicoComandas.solicitarConta(comandaId);
            setContaSolicitada(true);
            setMensagemSucesso('Conta solicitada. Aguarde o garçom.');
        } catch (erro) {
            console.error('[RevisarPedido] Erro conta', erro);
        }
    };

    const abrirModalTroca = () => {
        const numeroAtual = Number(comandaInfo?.mesaAtual?.numero ?? idMesa ?? 1);
        setNumeroMesaTroca(Number.isFinite(numeroAtual) ? numeroAtual : 1);
        setErroTrocaMesa('');
        setMostrarModalTroca(true);
    };

    const confirmarTrocaMesa = async () => {
        const comandaId = obterComandaId();
        const numeroMesaTrocaNumero = Number(numeroMesaTroca);
        if (!comandaId || !Number.isFinite(numeroMesaTrocaNumero) || numeroMesaTrocaNumero < 1) return;
        const inicioTroca = Date.now();
        setTrocandoMesa(true);
        setErroTrocaMesa('');
        try {
            const atualizada = await ServicoComandas.trocarMesa(numeroMesaTrocaNumero, comandaId);
            const tempoRestanteMs = Math.max(0, 600 - (Date.now() - inicioTroca));
            if (tempoRestanteMs > 0) {
                await new Promise(resolve => setTimeout(resolve, tempoRestanteMs));
            }
            setComandaInfo(atualizada);
            await carregarDados();
            const sufixoBusca = searchParams.toString();
            const numeroMesaAtual = atualizada.mesaAtual?.numero ?? numeroMesaTrocaNumero;
            void navigate(`/mesa/${String(numeroMesaAtual)}${sufixoBusca ? `?${sufixoBusca}` : ''}`);
            setMensagemSucesso('Mesa atualizada com sucesso.');
            setMostrarModalTroca(false);
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao trocar mesa', erro);
            let mensagem = 'Não foi possível trocar de mesa.';
            
            if (erro instanceof Error && erro.message) {
                try {
                    const erroParseado = JSON.parse(erro.message) as { message?: string };
                    mensagem = erroParseado.message ?? mensagem;
                } catch {
                    mensagem = erro.message;
                }
            }
            
            setErroTrocaMesa(mensagem);
        } finally {
            setTrocandoMesa(false);
        }
    };


    const carregarSolicitacoes = useCallback(async () => {
        const comandaId = obterComandaId();
        if (!comandaId) return;
        setCarregandoSolicitacoes(true);
        setErroSolicitacoes('');
        try {
            const lista = await ServicoComandas.listarDispositivos(comandaId);
            setDispositivos(lista);
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao carregar solicitacoes', erro);
            setErroSolicitacoes('Não foi possível carregar as solicitações.');
        } finally {
            setCarregandoSolicitacoes(false);
        }
    }, []);

    const abrirModalSolicitacoes = () => {
        setMostrarModalSolicitacoes(true);
        void carregarSolicitacoes();
    };

    const aprovarSolicitacao = async (idDispositivo: string) => {
        const comandaId = obterComandaId();
        if (!comandaId) return;
        try {
            await ServicoComandas.aprovarDispositivo(comandaId, idDispositivo);
            await carregarSolicitacoes();
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao aprovar dispositivo', erro);
        }
    };

    const recusarSolicitacao = async (idDispositivo: string) => {
        const comandaId = obterComandaId();
        if (!comandaId) return;
        try {
            await ServicoComandas.recusarDispositivo(comandaId, idDispositivo);
            await carregarSolicitacoes();
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao recusar dispositivo', erro);
        }
    };

    const revogarDispositivo = async (idDispositivo: string) => {
        const comandaId = obterComandaId();
        if (!comandaId) return;
        try {
            await ServicoComandas.revogarDispositivo(comandaId, idDispositivo);
            await carregarSolicitacoes();
        } catch (erro) {
            console.error('[RevisarPedido] Erro ao revogar dispositivo', erro);
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
                    <p className={styles.subtitulo}>Mesa {numeroMesaAtual}</p>
                    {comandaInfo && codigoComanda ? (
                        <div className={styles.comandaBox}>
                            <div>
                                <p className={styles.comandaRotulo}>Comanda</p>
                                <p className={styles.comandaCodigo}>{codigoComanda}</p>
                                <p className={styles.comandaHint}>Use o código para autorizar outros clientes.</p>
                                <div className={styles.comandaAcoes}>
                                    <Botao
                                        variante="secundario"
                                        tamanho="pequeno"
                                        onClick={() => { void navigator.clipboard.writeText(codigoComanda); }}
                                    >
                                        Copiar código
                                    </Botao>
                                    <Botao
                                        variante="primario"
                                        tamanho="pequeno"
                                        onClick={abrirModalTroca}
                                        disabled={contaSolicitada}
                                    >
                                        Trocar mesa
                                    </Botao>
                                    {ehMaster && (
                                        <Botao
                                            variante="secundario"
                                            tamanho="pequeno"
                                            onClick={abrirModalSolicitacoes}
                                        >
                                            Solicitações ({pendentes.length})
                                        </Botao>
                                    )}
                                </div>
                            </div>
                            {qrComanda !== '' && (
                                <div className={styles.comandaQr}>
                                    <img src={qrComanda} alt="QR Code da comanda" />
                                </div>
                            )}
                        </div>
                    ) : null}
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

            {mostrarModalTroca && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modal}>
                        <header className={styles.modalCabecalho}>
                            <div>
                                <p className={styles.modalRotulo}>Comanda</p>
                                <h2 className={styles.modalTitulo}>Trocar mesa</h2>
                                <p className={styles.modalHint}>A nova mesa não pode estar ocupada.</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalFechar}
                                onClick={() => { setMostrarModalTroca(false); }}
                                aria-label="Fechar modal de troca de mesa"
                            >
                                ×
                            </button>
                        </header>

                        {erroTrocaMesa && <p className={styles.modalErro}>{erroTrocaMesa}</p>}

                        <label className={styles.modalLabel} htmlFor="numero-mesa-troca">
                            Número da mesa
                        </label>
                        <input
                            id="numero-mesa-troca"
                            type="number"
                            min={1}
                            value={numeroMesaTroca}
                            onChange={(event) => {
                                const valor = event.target.value;
                                setNumeroMesaTroca(valor === '' ? '' : Number(valor));
                            }}
                            className={styles.modalInput}
                            disabled={trocandoMesa}
                        />

                        <div className={styles.modalAcoes}>
                            <Botao
                                variante="secundario"
                                onClick={() => { setMostrarModalTroca(false); }}
                                disabled={trocandoMesa}
                            >
                                Cancelar
                            </Botao>
                            <Botao
                                variante="primario"
                                onClick={() => { void confirmarTrocaMesa(); }}
                                disabled={trocandoMesa || numeroMesaTroca === '' || Number(numeroMesaTroca) < 1}
                            >
                                {trocandoMesa ? 'Trocando...' : 'Confirmar troca'}
                            </Botao>
                        </div>
                        {trocandoMesa && (
                            <p className={styles.modalHint}>Atualizando mesa da comanda...</p>
                        )}
                    </div>
                </div>
            )}

            {mostrarModalSolicitacoes && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modal}>
                        <header className={styles.modalCabecalho}>
                            <div>
                                <p className={styles.modalRotulo}>Comanda</p>
                                <h2 className={styles.modalTitulo}>Solicitações de acesso</h2>
                                <p className={styles.modalHint}>Aprove ou recuse novos dispositivos.</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalFechar}
                                onClick={() => { setMostrarModalSolicitacoes(false); }}
                                aria-label="Fechar modal de solicitações"
                            >
                                ×
                            </button>
                        </header>

                        {erroSolicitacoes && <p className={styles.modalErro}>{erroSolicitacoes}</p>}
                        {carregandoSolicitacoes && <p className={styles.modalHint}>Carregando solicitações...</p>}

                        {!carregandoSolicitacoes && (
                            <>
                                <div className={styles.modalLista}>
                                    {pendentes.length === 0 ? (
                                        <p className={styles.modalVazio}>Nenhuma solicitação pendente.</p>
                                    ) : (
                                        pendentes.map(dispositivo => (
                                            <div key={dispositivo.id} className={styles.modalItem}>
                                                <div>
                                                    <p className={styles.modalItemTitulo}>
                                                        {dispositivo.apelido ?? 'Dispositivo sem apelido'}
                                                    </p>
                                                    <p className={styles.modalItemSub}>
                                                        Status: {dispositivo.status}
                                                    </p>
                                                </div>
                                                <div className={styles.modalItemAcoes}>
                                                    <Botao
                                                        variante="secundario"
                                                        tamanho="pequeno"
                                                        onClick={() => { void recusarSolicitacao(dispositivo.id); }}
                                                    >
                                                        Recusar
                                                    </Botao>
                                                    <Botao
                                                        variante="primario"
                                                        tamanho="pequeno"
                                                        onClick={() => { void aprovarSolicitacao(dispositivo.id); }}
                                                    >
                                                        Aprovar
                                                    </Botao>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className={styles.modalLista}>
                                    {dispositivos.filter(dispositivo => dispositivo.status === 'aprovado' && !dispositivo.master && dispositivo.ativo).map(dispositivo => (
                                        <div key={dispositivo.id} className={styles.modalItem}>
                                            <div>
                                                <p className={styles.modalItemTitulo}>
                                                    {dispositivo.apelido ?? 'Dispositivo sem apelido'}
                                                </p>
                                                <p className={styles.modalItemSub}>Acesso aprovado</p>
                                            </div>
                                            <div className={styles.modalItemAcoes}>
                                                <Botao
                                                    variante="perigo"
                                                    tamanho="pequeno"
                                                    onClick={() => { void revogarDispositivo(dispositivo.id); }}
                                                >
                                                    Revogar
                                                </Botao>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className={styles.modalAcoes}>
                            <Botao variante="secundario" onClick={() => { void carregarSolicitacoes(); }}>
                                Atualizar
                            </Botao>
                            <button
                                type="button"
                                className={styles.modalFecharSecundario}
                                onClick={() => { setMostrarModalSolicitacoes(false); }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

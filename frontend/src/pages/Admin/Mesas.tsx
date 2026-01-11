import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Botao } from '../../components/Botao';
import { ServicoMesas } from '../../services/ServicoMesas';
import { ServicoComandas } from '../../services/ServicoComandas';
import type { Mesa } from '../../types/Mesa';
import type { Pedido } from '../../types/Pedido';
import type { ComandaResumo, DispositivoComanda } from '../../types/Comanda';
import { formatarMoeda } from '../../utils/formatadores';
import styles from './Mesas.module.css';

interface LinhaConta {
    id: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    total: number;
    observacoes: string[];
}

function agruparItensDaConta(pedidos: Pedido[]): LinhaConta[] {
    const mapa = new Map<string, LinhaConta>();

    pedidos.forEach(pedido => {
        pedido.itens.forEach(item => {
            const preco = item.precoUnitario ?? item.produto?.preco ?? 0;
            const nome = item.produto?.nome ?? 'Item do cardápio';
            const chave = `${item.idProduto}-${preco}`;
            const observacao = (item.observacao ?? '').trim();
            const existente = mapa.get(chave);

            if (existente) {
                existente.quantidade += item.quantidade;
                existente.total += preco * item.quantidade;
                if (observacao !== '') existente.observacoes.push(observacao);
                mapa.set(chave, existente);
            } else {
                mapa.set(chave, {
                    id: chave,
                    nome,
                    quantidade: item.quantidade,
                    precoUnitario: preco,
                    total: preco * item.quantidade,
                    observacoes: observacao !== '' ? [observacao] : [],
                });
            }
        });
    });

    return Array.from(mapa.values()).map(item => ({
        ...item,
        observacoes: Array.from(new Set(item.observacoes)),
    }));
}

function escaparHtml(valor: string): string {
    return valor.replace(/[&<>"']/g, (caractere) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[caractere] ?? caractere));
}

export function MesasAdmin() {
    const { mesas, adicionarMesa, excluirMesa, definirNumeroMesas, gerarLinkMesa, fecharMesa } = useAdmin();
    const [numeroMesa, setNumeroMesa] = useState(1);
    const [totalMesas, setTotalMesas] = useState(Math.max(1, mesas.length || 1));
    const [mensagem, setMensagem] = useState('');
    const [mesaConta, setMesaConta] = useState<{ id: string; numero: number } | null>(null);
    const [pedidosConta, setPedidosConta] = useState<Pedido[]>([]);
    const [carregandoConta, setCarregandoConta] = useState(false);
    const [erroConta, setErroConta] = useState('');
    const [ultimaAtualizacaoConta, setUltimaAtualizacaoConta] = useState<Date | null>(null);
    const [mostrarContaModal, setMostrarContaModal] = useState(false);
    const [comandaSelecionada, setComandaSelecionada] = useState<(ComandaResumo & { dispositivos: DispositivoComanda[] }) | null>(null);
    const [mostrarComandaModal, setMostrarComandaModal] = useState(false);
    const [carregandoComanda, setCarregandoComanda] = useState(false);
    const [erroComanda, setErroComanda] = useState('');
    const [mesaComandaId, setMesaComandaId] = useState<string | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<'todas' | 'livres' | 'ocupadas' | 'conta'>('todas');

    const mesaJaExiste = useMemo(() => 
        mesas.some(m => m.numero === numeroMesa), 
    [mesas, numeroMesa]);

    const mesasFiltradas = useMemo(() => {
        return mesas.filter(mesa => {
            if (filtroStatus === 'livres') return !mesa.ocupada;
            if (filtroStatus === 'ocupadas') return mesa.ocupada;
            if (filtroStatus === 'conta') return mesa.contaSolicitada;
            return true;
        }).sort((a, b) => a.numero - b.numero);
    }, [mesas, filtroStatus]);

    const contaLinhas = useMemo(() => agruparItensDaConta(pedidosConta), [pedidosConta]);
    const totalConta = useMemo(() => contaLinhas.reduce((acc, item) => acc + item.total, 0), [contaLinhas]);
    const mesaSelecionada = mesaConta ? mesas.find(m => m.id === mesaConta.id) : undefined;

    useEffect(() => {
        setTotalMesas(Math.max(1, mesas.length || 1));
    }, [mesas.length]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (mesaJaExiste) return;

        try {
            await adicionarMesa(numeroMesa);
            setMensagem(`Mesa ${numeroMesa} adicionada com sucesso.`);
            setNumeroMesa(1);
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao adicionar mesa', erro);
            setMensagem('Erro ao adicionar mesa. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    async function handleConfigurar(event: FormEvent) {
        event.preventDefault();
        try {
            await definirNumeroMesas(totalMesas);
            setMensagem(`Total de mesas atualizado para ${totalMesas}.`);
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao configurar mesas', erro);
            setMensagem('Erro ao atualizar mesas. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    async function handleExcluir(id: string) {
        try {
            await excluirMesa(id);
            setMensagem('Mesa excluída com sucesso.');
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao excluir mesa', erro);
            setMensagem(erro instanceof Error ? erro.message : 'Erro ao excluir mesa. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    function copiarLink(link: string) {
        void navigator.clipboard.writeText(link);
        setMensagem('Link copiado para a área de transferência.');
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    const carregarContaParaMesa = useCallback(async (mesaAlvo: Mesa, abrirModal = false) => {
        setMesaConta({ id: mesaAlvo.id, numero: mesaAlvo.numero });
        setCarregandoConta(true);
        setErroConta('');
        setPedidosConta([]);
        setUltimaAtualizacaoConta(null);
        if (abrirModal) {
            setMostrarContaModal(true);
        }

        try {
            const pedidos = await ServicoMesas.obterComanda(mesaAlvo.id);
            setPedidosConta(pedidos);
            setUltimaAtualizacaoConta(new Date());

            if (pedidos.length === 0) {
                setErroConta('Nenhum item em aberto para esta mesa.');
            }
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao carregar conta', erro);
            setPedidosConta([]);
            setUltimaAtualizacaoConta(null);
            setErroConta('Não foi possível carregar os itens dessa conta agora.');
        } finally {
            setCarregandoConta(false);
        }
    }, []);

    const carregarComandaParaMesa = useCallback(async (mesaAlvo: Mesa) => {
        setCarregandoComanda(true);
        setErroComanda('');
        setComandaSelecionada(null);
        setMesaComandaId(mesaAlvo.id);
        setMostrarComandaModal(true);

        try {
            const comanda = await ServicoComandas.obterComandaPorMesa(mesaAlvo.id);
            setComandaSelecionada(comanda);
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao carregar comanda', erro);
            setErroComanda('Não foi possível carregar a comanda desta mesa.');
        } finally {
            setCarregandoComanda(false);
        }
    }, []);

    const atualizarComandaSelecionada = useCallback(async () => {
        if (!mesaComandaId) return;
        setCarregandoComanda(true);
        setErroComanda('');
        try {
            const comanda = await ServicoComandas.obterComandaPorMesa(mesaComandaId);
            setComandaSelecionada(comanda);
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao atualizar comanda', erro);
            setErroComanda('Não foi possível atualizar a comanda.');
        } finally {
            setCarregandoComanda(false);
        }
    }, [mesaComandaId]);

    const limparComandaEmFoco = useCallback(() => {
        setComandaSelecionada(null);
        setMostrarComandaModal(false);
        setErroComanda('');
        setMesaComandaId(null);
    }, []);

    const limparContaEmFoco = useCallback(() => {
        setMesaConta(null);
        setPedidosConta([]);
        setErroConta('');
        setUltimaAtualizacaoConta(null);
        setMostrarContaModal(false);
    }, []);

    const handleImprimirConta = useCallback(() => {
        if (!mesaConta || contaLinhas.length === 0) return;

        const popup = window.open('', '_blank', 'width=720,height=900');
        if (!popup) {
            alert('Habilite pop-ups para imprimir a conta.');
            return;
        }

        const geradoEm = (ultimaAtualizacaoConta ?? new Date()).toLocaleString();
        const itensHtml = contaLinhas.map(item => `
            <tr>
                <td>${item.quantidade}x</td>
                <td>
                    ${escaparHtml(item.nome)}
                    ${item.observacoes.length ? `<div class="obs">Obs: ${escaparHtml(item.observacoes.join(' | '))}</div>` : ''}
                </td>
                <td>${formatarMoeda(item.precoUnitario)}</td>
                <td>${formatarMoeda(item.total)}</td>
            </tr>
        `).join('');

        popup.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Conta da Mesa ${mesaConta.numero}</title>
<style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { margin: 0; }
    .sub { color: #555; margin: 4px 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; }
    .total { text-align: right; font-size: 1.1rem; font-weight: bold; margin-top: 12px; }
    .obs { color: #555; font-size: 0.85rem; margin-top: 4px; }
    .topo { display: flex; justify-content: space-between; align-items: baseline; }
    .marca { font-size: 0.9rem; color: #777; }
</style>
</head>
<body>
    <div class="topo">
        <div>
            <p class="sub">Mesa ${mesaConta.numero}</p>
            <h1>Conta detalhada</h1>
            <p class="sub">Gerado em ${escaparHtml(geradoEm)}</p>
        </div>
        <div class="marca">Garçom Ágil</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Qtd</th>
                <th>Item</th>
                <th>Unitário</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${itensHtml || '<tr><td colspan="4">Nenhum item encontrado.</td></tr>'}
        </tbody>
    </table>
    <div class="total">Total: ${formatarMoeda(totalConta)}</div>
    <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
        popup.document.close();
    }, [contaLinhas, mesaConta, totalConta, ultimaAtualizacaoConta]);

    const handleVirarMasterAdmin = useCallback(async () => {
        if (!comandaSelecionada) return;
        try {
            await ServicoComandas.adminVirarMaster(comandaSelecionada.id);
            await atualizarComandaSelecionada();
            setMensagem('Admin definido como master da comanda.');
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao virar master', erro);
            setMensagem('Não foi possível assumir a comanda.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }, [atualizarComandaSelecionada, comandaSelecionada]);

    const handleDefinirMaster = useCallback(async (idDispositivo: string) => {
        if (!comandaSelecionada) return;
        try {
            await ServicoComandas.adminDefinirMaster(comandaSelecionada.id, idDispositivo);
            await atualizarComandaSelecionada();
            setMensagem('Master atualizado com sucesso.');
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao definir master', erro);
            setMensagem('Não foi possível atualizar o master.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }, [atualizarComandaSelecionada, comandaSelecionada]);

    const handleEncerrarComanda = useCallback(async () => {
        if (!comandaSelecionada) return;
        try {
            await ServicoComandas.adminEncerrar(comandaSelecionada.id);
            setMensagem('Comanda encerrada com sucesso.');
            limparComandaEmFoco();
        } catch (erro) {
            console.error('[MesasAdmin] Erro ao encerrar comanda', erro);
            setMensagem('Não foi possível encerrar a comanda.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }, [comandaSelecionada, limparComandaEmFoco]);

    useEffect(() => {
        if (mesaConta) {
            const mesaAtual = mesas.find(m => m.id === mesaConta.id);
            if (mesaAtual?.contaSolicitada) {
                return;
            }

            const proximaMesa = mesas.find(m => m.contaSolicitada);
            if (proximaMesa) {
                void carregarContaParaMesa(proximaMesa);
                return;
            }

            limparContaEmFoco();
            return;
        }

        const mesaComConta = mesas.find(m => m.contaSolicitada);
        if (mesaComConta) {
            void carregarContaParaMesa(mesaComConta);
        }
    }, [carregarContaParaMesa, limparContaEmFoco, mesaConta, mesas]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Salão</p>
                    <h1 className={styles.titulo}>Mesas e QR Code</h1>
                    <p className={styles.subtitulo}>Adicione, visualize e remova as mesas do seu restaurante.</p>
                </div>
            </header>

            <div className={styles.configGrid}>
                <section className={styles.formCard}>
                    <div>
                        <p className={styles.sectionLabel}>Nova mesa</p>
                        <h2 className={styles.sectionTitle}>Adicionar mesa única</h2>
                    </div>
                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                    >
                        <label className={styles.label} htmlFor="numero-mesa">
                            Número
                        </label>
                        <input
                            id="numero-mesa"
                            type="number"
                            min={1}
                            value={numeroMesa}
                            onChange={e => { setNumeroMesa(Number(e.target.value)); }}
                            className={styles.input}
                        />
                        {mesaJaExiste && (
                            <p className={styles.mensagem}>A mesa {numeroMesa} já cadastrada.</p>
                        )}
                        <Botao 
                            type="submit" 
                            variante="primario" 
                            tamanho="grande"
                            disabled={mesaJaExiste}
                        >
                            Adicionar
                        </Botao>
                        {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                    </form>
                </section>

                <section className={styles.formCard}>
                    <div>
                        <p className={styles.sectionLabel}>Configuração em massa</p>
                        <h2 className={styles.sectionTitle}>Definir total de mesas</h2>
                    </div>
                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            void handleConfigurar(event);
                        }}
                    >
                        <label className={styles.label} htmlFor="total-mesas">
                            Total de mesas no salão
                        </label>
                        <input
                            id="total-mesas"
                            type="number"
                            min={1}
                            value={totalMesas}
                            onChange={e => { setTotalMesas(Number(e.target.value)); }}
                            className={styles.input}
                        />
                        <Botao type="submit" variante="secundario" tamanho="grande">
                            Sincronizar Mesas
                        </Botao>
                        {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                    </form>
                </section>
            </div>

            <section className={styles.lista}>
                <div className={styles.listaHeader}>
                    <h2 className={styles.sectionTitle}>Mesas ativas</h2>
                    <div className={styles.filtros}>
                        <button 
                            className={`${styles.filtroBotao} ${filtroStatus === 'todas' ? styles.filtroBotaoAtivo : ''}`}
                            onClick={() => { setFiltroStatus('todas'); }}
                        >
                            Todas ({mesas.length})
                        </button>
                        <button 
                            className={`${styles.filtroBotao} ${filtroStatus === 'livres' ? styles.filtroBotaoAtivo : ''}`}
                            onClick={() => { setFiltroStatus('livres'); }}
                        >
                            Livres ({mesas.filter(m => !m.ocupada).length})
                        </button>
                        <button 
                            className={`${styles.filtroBotao} ${filtroStatus === 'ocupadas' ? styles.filtroBotaoAtivo : ''}`}
                            onClick={() => { setFiltroStatus('ocupadas'); }}
                        >
                            Ocupadas ({mesas.filter(m => m.ocupada).length})
                        </button>
                        <button 
                            className={`${styles.filtroBotao} ${filtroStatus === 'conta' ? styles.filtroBotaoAtivo : ''}`}
                            onClick={() => { setFiltroStatus('conta'); }}
                        >
                            Conta Pendente ({mesas.filter(m => m.contaSolicitada).length})
                        </button>
                    </div>
                </div>

                {mesasFiltradas.length === 0 ? (
                    <p className={styles.vazio}>
                        {mesas.length === 0 ? 'Nenhuma mesa configurada ainda.' : 'Nenhuma mesa encontrada para este filtro.'}
                    </p>
                ) : (
                    <div className={styles.grid}>
                        {mesasFiltradas.map(mesa => {
                            const link = gerarLinkMesa(mesa.numero);
                            const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`;

                            return (
                                <div 
                                    key={mesa.id} 
                                    className={`${styles.card} ${mesa.contaSolicitada ? styles.cardAlerta : ''}`}
                                >
                                    <div className={styles.qrWrapper}>
                                        <img src={imgSrc} alt={`QR Code mesa ${String(mesa.numero)}`} />
                                    </div>
                                    <p className={styles.mesaLabel}>Mesa {mesa.numero}</p>
                                    <p className={styles.link}>{link}</p>
                                    <div className={styles.statusLinha}>
                                        <span className={styles.badgeEstado} data-ocupada={mesa.ocupada}>
                                            {mesa.ocupada ? 'Ocupada' : 'Livre'}
                                        </span>
                                        {mesa.contaSolicitada ? <span className={styles.badgeConta}>Conta solicitada</span> : null}
                                    </div>
                                    <div className={styles.acoes}>
                                        <Botao
                                            variante="secundario"
                                            tamanho="pequeno"
                                            onClick={() => { copiarLink(link); }}
                                        >
                                            Copiar link
                                        </Botao>
                                        {mesa.ocupada && (
                                            <Botao
                                                variante="primario"
                                                tamanho="pequeno"
                                                onClick={() => { void carregarComandaParaMesa(mesa); }}
                                            >
                                                Gerenciar comanda
                                            </Botao>
                                        )}
                                        <Botao
                                            variante="perigo"
                                            tamanho="pequeno"
                                            onClick={() => { void handleExcluir(mesa.id); }}
                                        >
                                            Excluir
                                        </Botao>
                                        {mesa.ocupada && mesa.contaSolicitada && (
                                            <>
                                                <Botao
                                                    variante="primario"
                                                    tamanho="pequeno"
                                                    onClick={() => { void carregarContaParaMesa(mesa, true); }}
                                                >
                                                    Ver/Imprimir conta
                                                </Botao>
                                                <Botao
                                                    variante="secundario"
                                                    tamanho="pequeno"
                                                    onClick={() => { void fecharMesa(mesa.id); }}
                                                >
                                                    Fechar sessão
                                                </Botao>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {mostrarContaModal && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modalConta}>
                        <header className={styles.modalCabecalho}>
                            <div>
                                <p className={styles.sectionLabel}>Conta solicitada</p>
                                <h2 className={styles.modalTitulo}>Conta detalhada do cliente</h2>
                                <p className={styles.subtitulo}>Feche ou imprima a conta diretamente por aqui.</p>
                            </div>
                            <div className={styles.modalTag}>
                                {mesaConta ? `Mesa ${mesaConta.numero}` : 'Nenhuma mesa selecionada'}
                            </div>
                            <button
                                type="button"
                                className={styles.modalFechar}
                                onClick={limparContaEmFoco}
                                aria-label="Fechar modal de conta"
                            >
                                ×
                            </button>
                        </header>

                        {erroConta && <p className={styles.contaErro}>{erroConta}</p>}
                        {carregandoConta && <p className={styles.contaHint}>Carregando detalhes da conta...</p>}

                        {mesaConta ? (
                            <>
                                {contaLinhas.length > 0 ? (
                                    <div className={styles.contaLista}>
                                        {contaLinhas.map(item => (
                                            <div key={item.id} className={styles.contaItem}>
                                                <div>
                                                    <p className={styles.contaItemTitulo}>{item.quantidade}x {item.nome}</p>
                                                    {item.observacoes.length > 0 && (
                                                        <p className={styles.contaItemObs}>Obs: {item.observacoes.join(' | ')}</p>
                                                    )}
                                                </div>
                                                <div className={styles.contaItemValores}>
                                                    <span>{formatarMoeda(item.precoUnitario)}</span>
                                                    <strong>{formatarMoeda(item.total)}</strong>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    !carregandoConta && <p className={styles.contaHint}>Nenhum item em aberto para esta mesa.</p>
                                )}

                                <div className={styles.contaRodape}>
                                    <div className={styles.contaMeta}>
                                        <p className={styles.contaHint}>
                                            {ultimaAtualizacaoConta
                                                ? `Atualizado em ${ultimaAtualizacaoConta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : 'Atualize para puxar os pedidos dessa mesa.'}
                                        </p>
                                        {mesaSelecionada && mesaSelecionada.contaSolicitada && (
                                            <span className={styles.badgeConta}>Conta solicitada</span>
                                        )}
                                    </div>
                                    <div className={styles.contaTotal}>
                                        <span>Total</span>
                                        <strong>{formatarMoeda(totalConta)}</strong>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className={styles.contaHint}>Selecione uma mesa com conta solicitada para ver os itens.</p>
                        )}

                        <div className={styles.modalAcoes}>
                            <Botao
                                variante="primario"
                                onClick={() => { handleImprimirConta(); }}
                                disabled={!mesaConta || contaLinhas.length === 0 || carregandoConta}
                            >
                                Imprimir conta
                            </Botao>
                            <Botao
                                variante="secundario"
                                onClick={() => {
                                    if (mesaConta) {
                                        const mesaAtualizada = mesas.find(m => m.id === mesaConta.id);
                                        if (mesaAtualizada) {
                                            void carregarContaParaMesa(mesaAtualizada, true);
                                        }
                                    }
                                }}
                                disabled={!mesaConta || carregandoConta}
                            >
                                Atualizar conta
                            </Botao>
                            <button
                                type="button"
                                className={styles.contaLimpar}
                                onClick={limparContaEmFoco}
                                disabled={carregandoConta}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarComandaModal && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modalConta}>
                        <header className={styles.modalCabecalho}>
                            <div>
                                <p className={styles.sectionLabel}>Comanda ativa</p>
                                <h2 className={styles.modalTitulo}>Gerenciar comanda</h2>
                                <p className={styles.subtitulo}>Assuma o master ou encerre a comanda.</p>
                            </div>
                            <div className={styles.modalTag}>
                                {comandaSelecionada?.mesaAtual?.numero ? `Mesa ${comandaSelecionada.mesaAtual.numero}` : 'Mesa'}
                            </div>
                            <button
                                type="button"
                                className={styles.modalFechar}
                                onClick={limparComandaEmFoco}
                                aria-label="Fechar modal de comanda"
                            >
                                ×
                            </button>
                        </header>

                        {erroComanda && <p className={styles.comandaErro}>{erroComanda}</p>}
                        {carregandoComanda && <p className={styles.comandaHint}>Carregando comanda...</p>}

                        {comandaSelecionada ? (
                            <>
                                <div className={styles.comandaResumo}>
                                    <div>
                                        <p className={styles.comandaCodigo}>Código: {comandaSelecionada.codigo}</p>
                                        <p className={styles.comandaStatus}>Status: {comandaSelecionada.status}</p>
                                    </div>
                                    <div className={styles.modalAcoes}>
                                        <Botao variante="secundario" onClick={() => { void handleVirarMasterAdmin(); }}>
                                            Virar master
                                        </Botao>
                                        <Botao variante="perigo" onClick={() => { void handleEncerrarComanda(); }}>
                                            Encerrar comanda
                                        </Botao>
                                    </div>
                                </div>

                                <div className={styles.comandaLista}>
                                    {comandaSelecionada.dispositivos.map(dispositivo => (
                                        <div key={dispositivo.id} className={styles.comandaItem}>
                                            <div>
                                                <p className={styles.comandaItemTitulo}>
                                                    {dispositivo.apelido ?? 'Dispositivo sem apelido'}
                                                </p>
                                                <p className={styles.comandaItemSub}>
                                                    {dispositivo.master ? 'Master atual' : `Status: ${dispositivo.status}`}
                                                </p>
                                            </div>
                                            <div className={styles.comandaItemAcoes}>
                                                {!dispositivo.master && dispositivo.status === 'aprovado' && dispositivo.ativo && (
                                                    <Botao
                                                        variante="primario"
                                                        tamanho="pequeno"
                                                        onClick={() => { void handleDefinirMaster(dispositivo.id); }}
                                                    >
                                                        Definir master
                                                    </Botao>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            !carregandoComanda && <p className={styles.comandaHint}>Nenhuma comanda encontrada.</p>
                        )}

                        <div className={styles.modalAcoes}>
                            <Botao variante="secundario" onClick={() => { void atualizarComandaSelecionada(); }}>
                                Atualizar
                            </Botao>
                            <button
                                type="button"
                                className={styles.contaLimpar}
                                onClick={limparComandaEmFoco}
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

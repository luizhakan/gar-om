import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Botao } from '../../components/Botao';
import { ServicoMesas } from '../../services/ServicoMesas';
import type { Mesa } from '../../types/Mesa';
import type { Pedido } from '../../types/Pedido';
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

    const contaLinhas = useMemo(() => agruparItensDaConta(pedidosConta), [pedidosConta]);
    const totalConta = useMemo(() => contaLinhas.reduce((acc, item) => acc + item.total, 0), [contaLinhas]);
    const mesaSelecionada = mesaConta ? mesas.find(m => m.id === mesaConta.id) : undefined;

    useEffect(() => {
        setTotalMesas(Math.max(1, mesas.length || 1));
    }, [mesas.length]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
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

    const carregarContaParaMesa = useCallback(async (mesaAlvo: Mesa) => {
        setMesaConta({ id: mesaAlvo.id, numero: mesaAlvo.numero });
        setCarregandoConta(true);
        setErroConta('');
        setPedidosConta([]);
        setUltimaAtualizacaoConta(null);

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

    const limparContaEmFoco = useCallback(() => {
        setMesaConta(null);
        setPedidosConta([]);
        setErroConta('');
        setUltimaAtualizacaoConta(null);
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

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Nova mesa</p>
                    <h2 className={styles.sectionTitle}>Adicionar nova mesa</h2>
                </div>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <label className={styles.label} htmlFor="numero-mesa">
                        Número da mesa
                    </label>
                    <input
                        id="numero-mesa"
                        type="number"
                        min={1}
                        value={numeroMesa}
                        onChange={e => { setNumeroMesa(Number(e.target.value)); }}
                        className={styles.input}
                    />
                    <Botao type="submit" variante="primario" tamanho="grande">
                        Adicionar Mesa
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Configurar QR Codes</p>
                    <h2 className={styles.sectionTitle}>Definir quantidade total de mesas</h2>
                    <p className={styles.subtitulo}>Recria os QR Codes para o número informado, garantindo o restaurante correto.</p>
                </div>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleConfigurar(event);
                    }}
                >
                    <label className={styles.label} htmlFor="total-mesas">
                        Quantidade total de mesas
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
                        Atualizar QR Codes
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.lista}>
                <h2 className={styles.sectionTitle}>Mesas ativas</h2>
                {mesas.length === 0 ? (
                    <p className={styles.vazio}>Nenhuma mesa configurada ainda.</p>
                ) : (
                    <div className={styles.grid}>
                        {mesas.map(mesa => {
                            const link = gerarLinkMesa(mesa.numero);
                            const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`;

                            return (
                                <div key={mesa.id} className={styles.card}>
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
                                                    onClick={() => { void carregarContaParaMesa(mesa); }}
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

            <section className={styles.contaCard}>
                <div className={styles.contaCabecalho}>
                    <div>
                        <p className={styles.sectionLabel}>Conta solicitada</p>
                        <h2 className={styles.sectionTitle}>Conta detalhada do cliente</h2>
                        <p className={styles.subtitulo}>Assim que o cliente tocar em &quot;Fechar conta&quot;, os itens aparecem aqui para você imprimir.</p>
                    </div>
                    <div className={styles.contaChip} data-ativa={Boolean(mesaConta)}>
                        {mesaConta ? `Mesa ${mesaConta.numero}` : 'Nenhuma mesa selecionada'}
                    </div>
                </div>

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
                    <p className={styles.contaHint}>Nenhuma conta ativa agora. Quando uma mesa pedir, carregaremos aqui automaticamente.</p>
                )}

                <div className={styles.contaAcoes}>
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
                                    void carregarContaParaMesa(mesaAtualizada);
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
                        Limpar painel
                    </button>
                </div>
            </section>
        </div>
    );
}

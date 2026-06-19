import { useEffect, useState } from 'react';
import { ServicoPagamentos, type Restaurante, type VagasFundador, type PlanCode } from '../../services/ServicoPagamentos';
import styles from './Assinatura.module.css';

export function Assinatura() {
    const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
    const [vagasFundador, setVagasFundador] = useState<VagasFundador | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [processando, setProcessando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        carregarDados();

        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');

        if (status === 'success') {
            setSucesso(true);
            setTimeout(() => {
                setSucesso(false);
                window.history.replaceState({}, '', window.location.pathname);
            }, 5000);
        } else if (status === 'failure') {
            setErro('Pagamento não foi aprovado. Tente novamente.');
            setTimeout(() => {
                setErro('');
                window.history.replaceState({}, '', window.location.pathname);
            }, 5000);
        } else if (status === 'pending') {
            setSucesso(true);
            setErro('Pagamento pendente de confirmação. Você será notificado quando for aprovado.');
            setTimeout(() => {
                setErro('');
                setSucesso(false);
                window.history.replaceState({}, '', window.location.pathname);
            }, 5000);
        }
    }, []);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro('');
            const [dados, vagas] = await Promise.all([
                ServicoPagamentos.obterRestaurante(),
                ServicoPagamentos.obterVagasFundador().catch(() => null),
            ]);
            setRestaurante(dados);
            setVagasFundador(vagas);
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
            setCarregando(false);
        }
    }

    async function abrirCheckout(planCode: PlanCode) {
        try {
            setProcessando(true);
            setErro('');
            const resultado = await ServicoPagamentos.criarCheckout(planCode);
            const checkoutUrl = resultado.initPoint || resultado.sandboxInitPoint;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('URL de checkout não disponível');
            }
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao criar checkout.');
            setProcessando(false);
        }
    }

    function calcularDiasRestantes(): number {
        if (!restaurante) return 0;
        const diff = new Date(restaurante.trialEndsAt).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function obterLabelStatus(status: string): string {
        const labels: Record<string, string> = {
            trialing: 'Trial ativo',
            active: 'Ativa',
            past_due: 'Pagamento pendente',
            canceled: 'Cancelada',
            blocked: 'Bloqueada',
        };
        return labels[status] || status;
    }

    function obterVarianteStatus(status: string): string {
        if (status === 'trialing' || status === 'active') return '';
        if (status === 'past_due') return styles.aviso;
        return styles.inativo;
    }

    if (carregando) {
        return (
            <div className={styles.container}>
                <div className={styles.carregando}>Carregando...</div>
            </div>
        );
    }

    if (!restaurante) {
        return (
            <div className={styles.container}>
                <div className={styles.erroEstado}>{erro || 'Restaurante não encontrado'}</div>
            </div>
        );
    }

    const diasRestantes = calcularDiasRestantes();
    const mostrarPlanos = restaurante.subscriptionStatus !== 'active';

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <h1 className={styles.titulo}>Gestão de Assinatura</h1>
                <p className={styles.restauranteNome}>{restaurante.nome}</p>
            </div>

            {/* ── Status ── */}
            <div className={styles.statusCard}>
                <div className={styles.statusInfo}>
                    <p className={styles.statusLabel}>Status da assinatura</p>
                    <div
                        className={`${styles.statusBadge} ${obterVarianteStatus(restaurante.subscriptionStatus)}`}
                    >
                        {restaurante.subscriptionStatus === 'trialing' ? '● ' : ''}
                        {obterLabelStatus(restaurante.subscriptionStatus)}
                    </div>
                    <p className={styles.statusDatas}>
                        <span>Válido até </span>
                        {new Date(restaurante.trialEndsAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>

                    {diasRestantes <= 3 && diasRestantes > 0 && (
                        <div className={styles.alertaExpiracao}>
                            ⚠️ Sua assinatura expira em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}. Renove para evitar interrupções.
                        </div>
                    )}
                    {diasRestantes <= 0 && (
                        <div className={styles.alertaExpiracao}>
                            ⚠️ Sua assinatura expirou. Escolha um plano abaixo para continuar usando o sistema.
                        </div>
                    )}
                </div>

                <div className={styles.diasRestantes}>
                    <span className={styles.diasNumero}>{Math.max(0, diasRestantes)}</span>
                    <span className={styles.diasLabel}>dias restantes</span>
                </div>
            </div>

            {/* ── Card Fundador ── */}
            {vagasFundador?.elegivel && (
                <div className={styles.founderCard}>
                    <div className={styles.founderBadge}>🚀 Oferta Exclusiva — Apenas durante o Trial</div>

                    <h2 className={styles.founderTitulo}>Seja um dos 10 Fundadores</h2>
                    <p className={styles.founderDescricao}>
                        Garanta acesso anual completo por um preço especial disponível{' '}
                        <strong>apenas enquanto o seu trial estiver ativo</strong>. Quando as{' '}
                        {vagasFundador.vagasRestantes}{' '}
                        {vagasFundador.vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'}{' '}
                        acabarem, essa oferta desaparece para sempre.
                    </p>

                    <div className={styles.founderCorpo}>
                        <div className={styles.founderPrecos}>
                            <span className={styles.precoOriginal}>R$ 960,00/ano</span>
                            <div className={styles.precoFundador}>
                                R$ 500,00 <span>/ano</span>
                            </div>
                            <span className={styles.economiaFundador}>Economia de R$ 460,00</span>
                        </div>

                        <div className={styles.founderVagas}>
                            <span className={styles.vagasNumero}>{vagasFundador.vagasRestantes}</span>
                            <span className={styles.vagasLabel}>
                                {vagasFundador.vagasRestantes === 1 ? 'vaga' : 'vagas'} de 10
                            </span>
                        </div>
                    </div>

                    <div className={styles.founderAcoes}>
                        <button
                            className={styles.btnFounder}
                            onClick={() => abrirCheckout('founder')}
                            disabled={processando}
                        >
                            ⚡ Garantir minha vaga de Fundador
                        </button>
                        <p className={styles.founderAviso}>
                            * Após o 1º ano, renova pelo Plano Anual (R$ 960,00). Pagamento único via Mercado Pago.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Planos ── */}
            {mostrarPlanos && (
                <div className={styles.planosCard}>
                    <div className={styles.planosHeader}>
                        <h2>
                            {restaurante.subscriptionStatus === 'trialing'
                                ? 'Assine agora e some os dias ao seu trial'
                                : 'Escolha um plano para continuar'}
                        </h2>
                        <p>Pagamento único via Mercado Pago · PIX, Boleto ou Cartão</p>
                    </div>

                    <div className={styles.planosGrid}>
                        {/* Mensal */}
                        <div className={styles.plano}>
                            <p className={styles.planoNome}>Mensal</p>
                            <p className={styles.planPreco}>R$ 100</p>
                            <button
                                className={styles.btnRenovar}
                                onClick={() => abrirCheckout('mensal')}
                                disabled={processando}
                            >
                                Assinar agora
                            </button>
                        </div>

                        {/* Trimestral */}
                        <div className={`${styles.plano} ${styles.planoDestaque}`}>
                            <div className={styles.badgeDestaque}>Mais Popular</div>
                            <p className={styles.planoNome}>Trimestral</p>
                            <p className={styles.planPreco}>R$ 270</p>
                            <p className={styles.planoEconomia}>Economize 10%</p>
                            <button
                                className={styles.btnRenovar}
                                onClick={() => abrirCheckout('trimestral')}
                                disabled={processando}
                            >
                                Assinar agora
                            </button>
                        </div>

                        {/* Anual */}
                        <div className={styles.plano}>
                            <p className={styles.planoNome}>Anual</p>
                            <p className={styles.planPreco}>R$ 960</p>
                            <p className={styles.planoEconomia}>Economize 20%</p>
                            <button
                                className={styles.btnRenovar}
                                onClick={() => abrirCheckout('anual')}
                                disabled={processando}
                            >
                                Assinar agora
                            </button>
                        </div>
                    </div>

                    <div className={styles.infoSeguranca}>
                        <p>✅ Pagamento 100% seguro via Mercado Pago</p>
                        <p>✅ Aceita PIX, Boleto Bancário e Cartão de Crédito</p>
                        {restaurante.subscriptionStatus === 'trialing' && (
                            <p>✅ Dias somados ao tempo restante do seu trial</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Mensagens ── */}
            {erro && (
                <div className={`${styles.mensagem} ${styles.mensagemErro}`}>
                    ❌ {erro}
                </div>
            )}
            {sucesso && (
                <div className={`${styles.mensagem} ${styles.mensagemSucesso}`}>
                    ✅ Pagamento processado com sucesso! Sua assinatura foi atualizada.
                </div>
            )}
            {processando && (
                <div className={`${styles.mensagem} ${styles.mensagemProcessando}`}>
                    ⏳ Abrindo checkout...
                </div>
            )}

            {/* ── Histórico ── */}
            {restaurante.pagamentos && restaurante.pagamentos.length > 0 && (
                <div className={styles.historicoCard}>
                    <h2>Histórico de Pagamentos</h2>
                    <div className={styles.tabelaContainer}>
                        <table className={styles.tabelaPagamentos}>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Método</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurante.pagamentos.map((pagamento) => (
                                    <tr key={pagamento.id}>
                                        <td>
                                            {new Date(pagamento.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>R$ {pagamento.transactionAmount.toFixed(2)}</td>
                                        <td>
                                            <span
                                                className={`${styles.statusPagamento} ${
                                                    pagamento.status === 'approved'
                                                        ? styles.statusApproved
                                                        : pagamento.status === 'pending'
                                                        ? styles.statusPending
                                                        : styles.statusRejected
                                                }`}
                                            >
                                                {pagamento.status}
                                            </span>
                                        </td>
                                        <td>{pagamento.paymentMethodId || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

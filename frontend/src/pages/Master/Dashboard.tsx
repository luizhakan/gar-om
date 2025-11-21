import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao } from '../../components/Botao';
import { ServicoMaster, type RestauranteMasterInfo } from '../../services/ServicoMaster';
import { limparSessao, obterTipoSessao, obterToken } from '../../utils/sessao';
import styles from './MasterDashboard.module.css';

function formatarData(dataIso?: string | null) {
    if (!dataIso) return '—';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(dataIso));
}

function labelStatus(status: string) {
    switch (status) {
        case 'trialing': return 'Trial ativo';
        case 'active': return 'Assinatura ativa';
        case 'past_due': return 'Trial vencido';
        case 'canceled': return 'Cancelado';
        case 'blocked': return 'Bloqueado';
        default: return status;
    }
}

export function MasterDashboard() {
    const navigate = useNavigate();
    const [restaurantes, setRestaurantes] = useState<RestauranteMasterInfo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [atualizando, setAtualizando] = useState<string | null>(null);

    useEffect(() => {
        if (obterTipoSessao() !== 'master' || !obterToken()) {
            void navigate('/master/login', { replace: true });
            return;
        }
        void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function carregar() {
        setCarregando(true);
        setErro('');
        try {
            const dados = await ServicoMaster.listarRestaurantes();
            setRestaurantes(dados);
        } catch (e) {
            console.error('[MasterDashboard] Erro ao listar restaurantes', e);
            setErro('Não conseguimos carregar os restaurantes agora.');
        } finally {
            setCarregando(false);
        }
    }

    const totais = useMemo(() => {
        const total = restaurantes.length;
        const trial = restaurantes.filter(r => r.subscriptionStatus === 'trialing').length;
        const ativos = restaurantes.filter(r => r.subscriptionStatus === 'active').length;
        const vencidos = restaurantes.filter(r => r.statusEfetivo === 'past_due').length;
        const bloqueados = restaurantes.filter(r => r.statusEfetivo === 'blocked').length;
        return { total, trial, ativos, vencidos, bloqueados };
    }, [restaurantes]);

    async function atualizarStatus(id: string, payload: Partial<RestauranteMasterInfo> & { blocked?: boolean }) {
        setAtualizando(id);
        try {
            const atualizado = await ServicoMaster.atualizarRestaurante(id, payload);
            setRestaurantes(lista => lista.map(item => item.id === id ? { ...item, ...atualizado } : item));
        } catch (e) {
            console.error('[MasterDashboard] Falha ao atualizar restaurante', e);
            setErro('Não foi possível atualizar este restaurante.');
        } finally {
            setAtualizando(null);
        }
    }

    function logout() {
        limparSessao();
        void navigate('/master/login', { replace: true });
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.topo}>
                    <div>
                        <p className={styles.kicker}>Painel master</p>
                        <h1>Trials, cobranças e status de cada restaurante</h1>
                        <p className={styles.subtitulo}>Use esta visão para decidir quem ativa, quem vence e quem deve ser cobrado via Mercado Pago.</p>
                    </div>
                    <div className={styles.acoesTopo}>
                        <Botao variante="secundario" onClick={() => { void carregar(); }} disabled={carregando}>Atualizar lista</Botao>
                        <Botao variante="perigo" onClick={logout}>Sair</Botao>
                    </div>
                </header>

                <section className={styles.metricas}>
                    <div className={styles.metricCard}>
                        <p className={styles.metricLabel}>Restaurantes</p>
                        <p className={styles.metricValor}>{totais.total}</p>
                    </div>
                    <div className={styles.metricCard}>
                        <p className={styles.metricLabel}>Trial ativos</p>
                        <p className={styles.metricValor}>{totais.trial}</p>
                    </div>
                    <div className={styles.metricCard}>
                        <p className={styles.metricLabel}>Assinaturas ativas</p>
                        <p className={styles.metricValor}>{totais.ativos}</p>
                    </div>
                    <div className={styles.metricCard}>
                        <p className={styles.metricLabel}>Trial vencido</p>
                        <p className={styles.metricValor}>{totais.vencidos}</p>
                    </div>
                    <div className={styles.metricCard}>
                        <p className={styles.metricLabel}>Bloqueados</p>
                        <p className={styles.metricValor}>{totais.bloqueados}</p>
                    </div>
                </section>

                {erro && <p className={styles.erro}>{erro}</p>}
                {carregando && <p className={styles.loading}>Carregando dados...</p>}

                <section className={styles.lista}>
                    {restaurantes.map((restaurante) => (
                        <article key={restaurante.id} className={styles.cardRestaurante}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <p className={styles.nome}>{restaurante.nome}</p>
                                    <p className={styles.meta}>
                                        Admin: {restaurante.adminContato?.nome ?? '—'} ({restaurante.adminContato?.email ?? 'sem email'})
                                    </p>
                                </div>
                                <span className={`${styles.status} ${styles[restaurante.statusEfetivo ?? 'trialing']}`}>
                                    {labelStatus(restaurante.statusEfetivo ?? restaurante.subscriptionStatus)}
                                </span>
                            </div>

                            <div className={styles.infoGrid}>
                                <div>
                                    <p className={styles.label}>Trial termina em</p>
                                    <p className={styles.valor}>{formatarData(restaurante.trialEndsAt)}</p>
                                    <p className={styles.detalhe}>{restaurante.diasTrialRestantes} dias restantes</p>
                                </div>
                                <div>
                                    <p className={styles.label}>Plano</p>
                                    <p className={styles.valor}>{restaurante.planLabel ?? 'Trial Garçom'}</p>
                                    <p className={styles.detalhe}>Billing: {restaurante.billingEmail ?? '—'}</p>
                                </div>
                                <div>
                                    <p className={styles.label}>Mercado Pago</p>
                                    <p className={styles.valor}>{restaurante.mercadoPagoSubscriptionId ?? 'Sem assinatura'}</p>
                                    <p className={styles.detalhe}>{restaurante.mercadoPagoCustomerId ?? 'Cliente não vinculado'}</p>
                                </div>
                            </div>

                            <div className={styles.acoesCard}>
                                <Botao
                                    variante="primario"
                                    tamanho="pequeno"
                                    disabled={atualizando === restaurante.id}
                                    onClick={() => { void atualizarStatus(restaurante.id, { subscriptionStatus: 'active' }); }}
                                >
                                    Marcar como ativo
                                </Botao>
                                <Botao
                                    variante="secundario"
                                    tamanho="pequeno"
                                    disabled={atualizando === restaurante.id}
                                    onClick={() => { void atualizarStatus(restaurante.id, { subscriptionStatus: 'past_due' }); }}
                                >
                                    Trial vencido
                                </Botao>
                            <Botao
                                variante="perigo"
                                tamanho="pequeno"
                                disabled={atualizando === restaurante.id}
                                onClick={() => { void atualizarStatus(restaurante.id, { blocked: !restaurante.blockedAt }); }}
                            >
                                {restaurante.blockedAt ? 'Reativar' : 'Bloquear'}
                            </Botao>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}

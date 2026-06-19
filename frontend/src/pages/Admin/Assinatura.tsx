import { useEffect, useState } from 'react';
import { ServicoPagamentos, type Restaurante, type VagasFundador, type PlanCode } from '../../services/ServicoPagamentos';
import './Assinatura.module.css';
import { Botao } from '../../components/Botao';

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
        const agora = new Date();
        const fim = new Date(restaurante.trialEndsAt);
        const diff = fim.getTime() - agora.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function obterStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            trialing: 'Em período de trial',
            active: 'Ativa',
            past_due: 'Pagamento pendente',
            canceled: 'Cancelada',
            blocked: 'Bloqueada',
        };
        return labels[status] || status;
    }

    function obterCorStatus(status: string): string {
        const cores: Record<string, string> = {
            trialing: '#2196F3',
            active: '#4CAF50',
            past_due: '#FF9800',
            canceled: '#F44336',
            blocked: '#9E9E9E',
        };
        return cores[status] || '#9E9E9E';
    }

    if (carregando) {
        return (
            <div className="assinatura-container">
                <div className="carregando">Carregando...</div>
            </div>
        );
    }

    if (!restaurante) {
        return (
            <div className="assinatura-container">
                <div className="erro">{erro || 'Restaurante não encontrado'}</div>
            </div>
        );
    }

    const diasRestantes = calcularDiasRestantes();
    const expirouOuProximoExpirar = diasRestantes <= 7;
    // Mostra planos tanto quando a assinatura está inativa quanto durante o trial
    const mostrarPlanos =
        restaurante.subscriptionStatus !== 'active' ||
        restaurante.subscriptionStatus === 'trialing';

    return (
        <div className="assinatura-container">
            <div className="assinatura-header">
                <h1>Gestão de Assinatura</h1>
                <p className="restaurante-nome">{restaurante.nome}</p>
            </div>

            {/* Status da Assinatura */}
            <div className="card status-card">
                <h2>Status Atual</h2>
                <div className="status-info">
                    <div
                        className="status-badge"
                        style={{ backgroundColor: obterCorStatus(restaurante.subscriptionStatus) }}
                    >
                        {obterStatusLabel(restaurante.subscriptionStatus)}
                    </div>
                    <div className="dias-restantes">
                        <strong>{diasRestantes > 0 ? diasRestantes : 0}</strong> dias restantes
                    </div>
                </div>
                <div className="datas">
                    <p>
                        <span>Válido até:</span>{' '}
                        {new Date(restaurante.trialEndsAt).toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {expirouOuProximoExpirar && (
                    <div className="alerta-expiracao">
                        ⚠️{' '}
                        {diasRestantes <= 0
                            ? 'Sua assinatura expirou! Renove agora para continuar usando o sistema.'
                            : 'Sua assinatura está próxima do vencimento. Renove para evitar interrupções.'}
                    </div>
                )}
            </div>

            {/* Card Fundador — só aparece quando elegível */}
            {vagasFundador?.elegivel && (
                <div className="card founder-card">
                    <div className="founder-badge">🚀 Oferta Exclusiva — Plano Fundador</div>
                    <h2>Seja um dos 10 Fundadores</h2>
                    <p className="founder-descricao">
                        Garanta acesso anual completo por um preço especial disponível{' '}
                        <strong>apenas durante seu trial</strong>. Quando os {' '}
                        {vagasFundador.vagasRestantes} {vagasFundador.vagasRestantes === 1 ? 'lugar restante' : 'lugares restantes'} acabarem,
                        essa oferta some para sempre.
                    </p>

                    <div className="founder-preco-container">
                        <div className="founder-preco">
                            <span className="preco-original">R$ 960,00/ano</span>
                            <span className="preco-fundador">R$ 500,00/ano</span>
                            <span className="economia-fundador">Economize R$ 460,00</span>
                        </div>
                        <div className="founder-vagas">
                            <span className="vagas-numero">{vagasFundador.vagasRestantes}</span>
                            <span className="vagas-label">
                                {vagasFundador.vagasRestantes === 1 ? 'vaga restante' : 'vagas restantes'} de 10
                            </span>
                        </div>
                    </div>

                    <Botao
                        className="btn-founder"
                        onClick={() => abrirCheckout('founder')}
                        disabled={processando}
                    >
                        ⚡ Garantir minha vaga de Fundador
                    </Botao>

                    <p className="founder-aviso">
                        * Após o 1º ano, renova pelo plano Anual (R$ 960,00). Pagamento único via Mercado Pago.
                    </p>
                </div>
            )}

            {/* Planos — visível durante trial e quando inativo */}
            {mostrarPlanos && (
                <div className="card acoes-card">
                    <h2>
                        {restaurante.subscriptionStatus === 'trialing'
                            ? 'Assine agora e some os dias ao seu trial'
                            : 'Renovar Assinatura'}
                    </h2>
                    <p>Escolha o plano que melhor se adequa às suas necessidades:</p>

                    <div className="planos-container">
                        <div className="plano">
                            <h3>Plano Mensal</h3>
                            <p className="preco">R$ 100,00/mês</p>
                            <Botao
                                className="btn-renovar"
                                onClick={() => abrirCheckout('mensal')}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>

                        <div className="plano destaque">
                            <div className="badge-destaque">Mais Popular</div>
                            <h3>Plano Trimestral</h3>
                            <p className="preco">R$ 270,00</p>
                            <p className="economia">(Economize 10% — R$ 90,00/mês)</p>
                            <Botao
                                className="btn-renovar"
                                onClick={() => abrirCheckout('trimestral')}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>

                        <div className="plano">
                            <h3>Plano Anual</h3>
                            <p className="preco">R$ 960,00</p>
                            <p className="economia">(Economize 20% — R$ 80,00/mês)</p>
                            <Botao
                                className="btn-renovar"
                                onClick={() => abrirCheckout('anual')}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>
                    </div>

                    <div className="info-pagamento">
                        <p>✅ Pagamento 100% seguro via Mercado Pago</p>
                        <p>✅ Aceita PIX, Boleto Bancário e Cartão de Crédito</p>
                        <p>✅ Dias somados ao tempo restante do seu trial</p>
                    </div>
                </div>
            )}

            {/* Mensagens */}
            {erro && <div className="mensagem erro-mensagem">❌ {erro}</div>}
            {sucesso && (
                <div className="mensagem sucesso-mensagem">
                    ✅ Pagamento processado com sucesso! Sua assinatura foi atualizada.
                </div>
            )}
            {processando && (
                <div className="mensagem processando-mensagem">⏳ Abrindo checkout...</div>
            )}

            {/* Histórico de Pagamentos */}
            {restaurante.pagamentos && restaurante.pagamentos.length > 0 && (
                <div className="card historico-card">
                    <h2>Histórico de Pagamentos</h2>
                    <div className="tabela-container">
                        <table className="tabela-pagamentos">
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
                                                className={`status-pagamento status-${pagamento.status}`}
                                            >
                                                {pagamento.status}
                                            </span>
                                        </td>
                                        <td>{pagamento.paymentMethodId}</td>
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

import { useEffect, useState } from 'react';
import { ServicoPagamentos, type Restaurante } from '../../services/ServicoPagamentos';
import './Assinatura.module.css';
import { Botao } from '../../components/Botao';

export function Assinatura() {
    const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [processando, setProcessando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        carregarDados();
        
        // Verifica se retornou do checkout com sucesso
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        
        if (status === 'success') {
            setSucesso(true);
            setTimeout(() => {
                setSucesso(false);
                // Remove o parâmetro da URL
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
            const dados = await ServicoPagamentos.obterRestaurante();
            setRestaurante(dados);
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
            setCarregando(false);
        }
    }

    async function abrirCheckout(planDurationMonths: number = 1) {
        try {
            setProcessando(true);
            setErro('');

            const resultado = await ServicoPagamentos.criarCheckout(planDurationMonths);
            
            // Redireciona para o checkout do Mercado Pago
            // Em produção, usa initPoint; em sandbox/teste, pode usar sandboxInitPoint
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

    const assinaturaInativa = restaurante.subscriptionStatus !== 'active' && restaurante.subscriptionStatus !== 'trialing';
    const diasRestantes = calcularDiasRestantes();
    const expirouOuProximoExpirar = diasRestantes <= 7;

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
                    <div className="status-badge" style={{ backgroundColor: obterCorStatus(restaurante.subscriptionStatus) }}>
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
                        ⚠️ {diasRestantes <= 0 
                            ? 'Sua assinatura expirou! Renove agora para continuar usando o sistema.' 
                            : 'Sua assinatura está próxima do vencimento. Renove para evitar interrupções.'}
                    </div>
                )}
            </div>

            {/* Botão de Renovação */}
            {assinaturaInativa && (
                <div className="card acoes-card">
                    <h2>Renovar Assinatura</h2>
                    <p>Escolha o plano que melhor se adequa às suas necessidades:</p>
                    
                    <div className="planos-container">
                        <div className="plano">
                            <h3>Plano Mensal</h3>
                            <p className="preco">R$ 100,00/mês</p>
                            <Botao 
                                className="btn-renovar"
                                onClick={() => abrirCheckout(1)}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>
                        
                        <div className="plano destaque">
                            <div className="badge-destaque">Mais Popular</div>
                            <h3>Plano Trimestral</h3>
                            <p className="preco">R$ 270,00</p>
                            <p className="economia">(Economize 10% - R$ 90,00/mês)</p>
                            <Botao 
                                className="btn-renovar"
                                onClick={() => abrirCheckout(3)}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>
                        
                        <div className="plano">
                            <h3>Plano Anual</h3>
                            <p className="preco">R$ 960,00</p>
                            <p className="economia">(Economize 20% - R$ 80,00/mês)</p>
                            <Botao 
                                className="btn-renovar"
                                onClick={() => abrirCheckout(12)}
                                disabled={processando}
                            >
                                💳 Pagar com PIX, Boleto ou Cartão
                            </Botao>
                        </div>
                    </div>
                    
                    <div className="info-pagamento">
                        <p>✅ Pagamento 100% seguro via Mercado Pago</p>
                        <p>✅ Aceita PIX, Boleto Bancário e Cartão de Crédito</p>
                        <p>✅ Ativação imediata após confirmação do pagamento</p>
                    </div>
                </div>
            )}

            {/* Mensagens */}
            {erro && (
                <div className="mensagem erro-mensagem">
                    ❌ {erro}
                </div>
            )}

            {sucesso && (
                <div className="mensagem sucesso-mensagem">
                    ✅ Pagamento processado com sucesso! Sua assinatura foi renovada.
                </div>
            )}

            {processando && (
                <div className="mensagem processando-mensagem">
                    ⏳ Processando pagamento...
                </div>
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
                                        <td>{new Date(pagamento.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td>R$ {pagamento.transactionAmount.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-pagamento status-${pagamento.status}`}>
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

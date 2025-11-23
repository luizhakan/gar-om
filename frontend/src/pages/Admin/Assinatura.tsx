import { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import type { ICardPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/cardPayment/type';
import { ServicoPagamentos, type Restaurante, type CreatePaymentDto } from '../../services/ServicoPagamentos';
import './Assinatura.module.css';
import { Botao } from '../../components/Botao';

// Inicializar Mercado Pago SDK com a chave pública
const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY as string;
if (MERCADO_PAGO_PUBLIC_KEY) {
    initMercadoPago(MERCADO_PAGO_PUBLIC_KEY);
}

export function Assinatura() {
    const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        carregarDados();
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

    async function processarPagamento(formData: ICardPaymentFormData<unknown>) {
        if (!restaurante) return;

        try {
            setProcessando(true);
            setErro('');

            const dto: CreatePaymentDto = {
                token: formData.token,
                transactionAmount: 50.00, // Valor da assinatura mensal
                description: 'Assinatura Garçom - Renovação Mensal',
                installments: formData.installments,
                paymentMethodId: formData.payment_method_id,
                payer: {
                    email: restaurante.billingEmail,
                },
                planDurationMonths: 1,
            };

            await ServicoPagamentos.criarPagamento(dto);
            setSucesso(true);
            setMostrarFormulario(false);
            
            // Recarrega os dados após 2 segundos
            setTimeout(() => {
                carregarDados();
                setSucesso(false);
            }, 2000);
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao processar pagamento.');
        } finally {
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
                    <Botao 
                        className="btn-renovar"
                        onClick={() => setMostrarFormulario(true)}
                        disabled={processando}
                    >
                        💳 Renovar Assinatura (R$ 50,00/mês)
                    </Botao>
                </div>
            )}

            {/* Formulário de Pagamento */}
            {mostrarFormulario && MERCADO_PAGO_PUBLIC_KEY && (
                <div className="card pagamento-card">
                    <h2>Pagamento da Assinatura</h2>
                    <p className="valor-assinatura">Valor: R$ 50,00/mês</p>
                    
                    <CardPayment
                        initialization={{
                            amount: 50.00,
                            payer: {
                                email: restaurante.billingEmail,
                            },
                        }}
                        onSubmit={async (formData) => {
                            await processarPagamento(formData);
                        }}
                        onError={(error) => {
                            console.error('Erro no CardPayment:', error);
                            setErro('Erro ao processar pagamento. Tente novamente.');
                        }}
                    />

                    <button 
                        className="btn-cancelar"
                        onClick={() => setMostrarFormulario(false)}
                        disabled={processando}
                    >
                        Cancelar
                    </button>
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

            {/* Aviso sobre chave do Mercado Pago */}
            {!MERCADO_PAGO_PUBLIC_KEY && (
                <div className="mensagem erro-mensagem">
                    ⚠️ Chave pública do Mercado Pago não configurada. Configure a variável VITE_MERCADO_PAGO_PUBLIC_KEY
                </div>
            )}
        </div>
    );
}

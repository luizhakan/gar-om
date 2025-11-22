import { requestAutenticado } from './requestAutenticado';

export interface PayerIdentification {
    type: string;
    number: string;
}

export interface Payer {
    email: string;
    identification?: PayerIdentification;
}

export interface CreatePaymentDto {
    token: string;
    transactionAmount: number;
    description: string;
    installments: number;
    paymentMethodId: string;
    payer: Payer;
    planDurationMonths?: number;
}

export interface Pagamento {
    id: string;
    restauranteId: string;
    transactionAmount: number;
    status: string;
    statusDetail: string | null;
    paymentMethodId: string;
    paymentTypeId: string;
    mercadoPagoId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Restaurante {
    id: string;
    nome: string;
    billingEmail: string;
    subscriptionStatus: string;
    trialStartedAt: string;
    trialEndsAt: string;
    blockedAt: string | null;
    planLabel: string | null;
    pagamentos: Pagamento[];
}

export function verificarBloqueioAssinatura(restaurante: Restaurante): {
    bloqueado: boolean;
    diasAtraso: number;
    mensagem: string;
} {
    const agora = new Date();
    const dataVencimento = new Date(restaurante.trialEndsAt);
    const diffMs = agora.getTime() - dataVencimento.getTime();
    const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Bloqueia se passou 3 dias após vencimento
    if (diasAtraso >= 3) {
        return {
            bloqueado: true,
            diasAtraso,
            mensagem: `Sua assinatura está ${diasAtraso} dias atrasada. Renove para continuar usando o sistema.`,
        };
    }

    return {
        bloqueado: false,
        diasAtraso: Math.max(0, diasAtraso),
        mensagem: '',
    };
}

export const ServicoPagamentos = {
    async criarPagamento(dto: CreatePaymentDto): Promise<Pagamento> {
        return requestAutenticado<Pagamento>('/pagamentos', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    },

    async buscarPagamento(id: string): Promise<Pagamento> {
        return requestAutenticado<Pagamento>(`/pagamentos/${id}`, {
            method: 'GET',
        });
    },

    async obterRestaurante(): Promise<Restaurante> {
        return requestAutenticado<Restaurante>('/auth/restaurante', {
            method: 'GET',
        });
    },
};

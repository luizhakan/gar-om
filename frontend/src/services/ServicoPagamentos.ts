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
    const statusPermitidos = ['trialing', 'active'];
    
    // Se o status não é permitido, bloqueia imediatamente
    if (!statusPermitidos.includes(restaurante.subscriptionStatus)) {
        return {
            bloqueado: true,
            diasAtraso: 0,
            mensagem: 'Assinatura inválida. Renove sua assinatura para continuar usando o sistema.',
        };
    }

    // Se está em trialing, verifica se não expirou
    if (restaurante.subscriptionStatus === 'trialing') {
        const agora = new Date();
        const dataVencimento = new Date(restaurante.trialEndsAt);
        const diffMs = agora.getTime() - dataVencimento.getTime();
        const diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diasAtraso > 0) {
            return {
                bloqueado: true,
                diasAtraso,
                mensagem: `Período de trial expirado há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}. Renove sua assinatura para continuar usando o sistema.`,
            };
        }
    }

    return {
        bloqueado: false,
        diasAtraso: 0,
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

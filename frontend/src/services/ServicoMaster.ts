import { env } from '../config/env';
import { obterToken } from '../utils/sessao';

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

export interface RestauranteMasterInfo {
    id: string;
    nome: string;
    createdAt: string;
    trialStartedAt: string;
    trialEndsAt: string;
    diasTrialRestantes: number;
    subscriptionStatus: string;
    statusEfetivo: string;
    planLabel?: string | null;
    billingEmail?: string | null;
    billingPhone?: string | null;
    mercadoPagoCustomerId?: string | null;
    mercadoPagoSubscriptionId?: string | null;
    blockedAt?: string | null;
    adminContato: { id: string; nome: string; email: string } | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = obterToken();
    if (!token) {
        throw new Error('Sessão master expirada. Faça login novamente.');
    }

    const resp = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(init?.headers ?? {}),
        },
    });

    if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || 'Falha na requisição master');
    }

    return resp.json() as Promise<T>;
}

export const ServicoMaster = {
    listarRestaurantes() {
        return request<RestauranteMasterInfo[]>('/master/restaurantes');
    },

    atualizarRestaurante(
        id: string,
        payload: Partial<Omit<RestauranteMasterInfo, 'id' | 'adminContato'>> & { blocked?: boolean },
    ) {
        return request<RestauranteMasterInfo>(`/master/restaurantes/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },
};

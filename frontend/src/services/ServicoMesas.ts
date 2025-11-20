import type { Mesa } from '../types/Mesa';
import { env } from '../config/env';
import { obterToken } from '../utils/sessao';

interface MesaApi {
    id: string;
    numero: number;
    codigoQr: string;
    ocupada: boolean;
    restauranteId: string;
}

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    const token = obterToken();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const resposta = await fetch(`${API_BASE}${path}`, {
        headers,
        ...init,
    });

    if (!resposta.ok) {
        const texto = await resposta.text();
        throw new Error(texto || 'Falha na requisição de mesas');
    }

    return resposta.json() as Promise<T>;
}

function mapearMesaApi(payload: MesaApi): Mesa {
    return {
        id: payload.id,
        numero: payload.numero,
        codigoQr: payload.codigoQr,
        ocupada: payload.ocupada,
        restauranteId: payload.restauranteId,
    };
}

export const ServicoMesas = {
    async listar(): Promise<Mesa[]> {
        const data = await requestApi<MesaApi[]>('/mesas');
        return data.map(mapearMesaApi);
    },

    async adicionarMesa(numero: number): Promise<Mesa> {
        const data = await requestApi<MesaApi>('/mesas', {
            method: 'POST',
            body: JSON.stringify({
                numero,
                baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
            }),
        });
        return mapearMesaApi(data);
    },

    async excluirMesa(id: string): Promise<void> {
        await requestApi(`/mesas/${id}`, {
            method: 'DELETE',
        });
    },
};

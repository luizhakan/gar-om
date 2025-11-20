import type { Mesa } from '../types/Mesa';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

interface MesaApi {
    id: string;
    numero: number;
    codigoQr: string;
    ocupada: boolean;
    restauranteId: string;
}

const CHAVE_STORAGE = 'garcom_mesas';
const API_BASE = env.apiBaseUrl?.replace(/\/$/, '') ?? '';
const usarApi = Boolean(API_BASE);

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    if (!usarApi) {
        throw new Error('API não configurada');
    }

    const restauranteId = obterRestauranteId();
    if (!restauranteId) {
        throw new Error('Restaurante não definido na sessão');
    }
    const token = obterToken();

    const resposta = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-restaurante-id': restauranteId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...init,
    });

    if (!resposta.ok) {
        const texto = await resposta.text();
        throw new Error(texto || 'Falha na requisição de mesas');
    }

    return resposta.json() as Promise<T>;
}

function obterStorage(): Mesa[] {
    if (typeof window === 'undefined') return [];
    const dados = window.localStorage.getItem(CHAVE_STORAGE);
    if (!dados) return [];
    try {
        const parsed = JSON.parse(dados) as Mesa[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
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
        if (usarApi) {
            const data = await requestApi<MesaApi[]>('/mesas');
            return data.map(mapearMesaApi);
        }
        return obterStorage();
    },

    async configurar(total: number): Promise<Mesa[]> {
        if (!usarApi) throw new Error('API não configurada');

        const data = await requestApi<MesaApi[]>('/mesas/configurar', {
            method: 'PUT',
            body: JSON.stringify({
                total,
                baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
            }),
        });
        return data.map(mapearMesaApi);
    },
};

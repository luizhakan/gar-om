import type { Mesa } from '../types/Mesa';
import { env } from '../config/env';
import { gerarIdAleatorio } from '../utils/formatadores';
import { obterRestauranteId } from '../utils/sessao';

const CHAVE_STORAGE = 'garcom_mesas';
const API_BASE = env.apiBaseUrl?.replace(/\/$/, '') ?? '';
const usarApi = Boolean(API_BASE);

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    if (!usarApi) {
        throw new Error('API não configurada');
    }

    const restauranteId = obterRestauranteId();

    const resposta = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(restauranteId ? { 'x-restaurante-id': restauranteId } : {}),
        },
        ...init,
    });

    if (!resposta.ok) {
        const texto = await resposta.text();
        throw new Error(texto || 'Falha na requisição de mesas');
    }

    return resposta.json() as Promise<T>;
}

function gerarLinkMesa(numeroMesa: number) {
    const base = typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:5173';
    return `${base}/mesa/${numeroMesa}`;
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

function salvarStorage(mesas: Mesa[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(mesas));
}

function mapearMesaApi(payload: any): Mesa {
    return {
        id: payload.id,
        numero: payload.numero,
        codigoQr: payload.codigoQr ?? payload.codigo_qr ?? gerarLinkMesa(payload.numero),
        ocupada: payload.ocupada ?? false,
    };
}

export const ServicoMesas = {
    async listar(): Promise<Mesa[]> {
        if (usarApi) {
            try {
                const data = await requestApi<any[]>('/mesas');
                return data.map(mapearMesaApi);
            } catch (error) {
                console.warn('[ServicoMesas] Falha ao listar via API, fallback local.', error);
            }
        }
        return obterStorage();
    },

    async configurar(total: number): Promise<Mesa[]> {
        if (usarApi) {
            try {
                const data = await requestApi<any>('/mesas/configurar', {
                    method: 'PUT',
                    body: JSON.stringify({
                        total,
                        baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
                    }),
                });
                const mesasCriadas = (data as any[]).map(mapearMesaApi);
                return mesasCriadas;
            } catch (error) {
                console.warn('[ServicoMesas] Falha ao configurar via API, salvando local.', error);
            }
        }

        const mesasNovas: Mesa[] = Array.from({ length: total }, (_, index) => {
            const numero = index + 1;
            return {
                id: gerarIdAleatorio(),
                numero,
                codigoQr: gerarLinkMesa(numero),
                ocupada: false,
            };
        });

        salvarStorage(mesasNovas);
        return mesasNovas;
    }
};

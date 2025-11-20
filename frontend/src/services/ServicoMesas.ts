import type { Mesa } from '../types/Mesa';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

interface MesaApi {
    id: string;
    numero: number;
    codigoQr: string;
    ocupada: boolean;
    contaSolicitada?: boolean;
    restauranteId: string;
}

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    const token = obterToken();
    const restauranteId = obterRestauranteId();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if ((restauranteId ?? '') !== '') {
        headers['x-restaurante-id'] = restauranteId ?? '';
    }

    const resposta = await fetch(`${API_BASE}${path}`, {
        headers,
        ...init,
    });

    const textoResposta = await resposta.text();

    if (!resposta.ok) {
        // Corpo pode ser vazio ou JSON com mensagem
        if ((textoResposta ?? '') !== '') {
            try {
                const parsed = JSON.parse(textoResposta) as { message?: string };
                throw new Error(parsed.message || textoResposta || 'Falha na requisição de mesas');
            } catch {
                throw new Error(textoResposta || 'Falha na requisição de mesas');
            }
        }
        throw new Error('Falha na requisição de mesas');
    }

    if ((textoResposta ?? '') === '') {
        // Algumas rotas (DELETE) podem não retornar corpo
        return undefined as T;
    }

    try {
        return JSON.parse(textoResposta) as T;
    } catch {
        throw new Error('Resposta inválida ao processar mesas');
    }
}

function mapearMesaApi(payload: MesaApi): Mesa {
    return {
        id: payload.id,
        numero: payload.numero,
        codigoQr: payload.codigoQr,
        ocupada: payload.ocupada,
        contaSolicitada: payload.contaSolicitada ?? false,
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

    async configurarMesas(total: number): Promise<Mesa[]> {
        const data = await requestApi<MesaApi[]>('/mesas/configurar', {
            method: 'POST',
            body: JSON.stringify({
                total,
                baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
            }),
        });
        return data.map(mapearMesaApi);
    },

    async excluirMesa(id: string): Promise<void> {
        await requestApi(`/mesas/${id}`, {
            method: 'DELETE',
        });
    },

    async fecharMesa(id: string): Promise<Mesa> {
        const data = await requestApi<MesaApi>(`/mesas/${id}/fechar`, {
            method: 'PATCH',
        });
        return mapearMesaApi(data);
    },

    async solicitarConta(idMesa: string): Promise<void> {
        const restauranteId = obterRestauranteId();
        if ((restauranteId ?? '') === '') {
            throw new Error('Restaurante não definido na sessão');
        }
        await fetch(`${API_BASE}/mesas/${idMesa}/solicitar-conta`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-restaurante-id': restauranteId ?? '',
            },
        }).then(async resposta => {
            if (!resposta.ok) {
                const texto = await resposta.text();
                throw new Error(texto || 'Falha ao solicitar conta');
            }
        });
    },
};

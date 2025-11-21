import { env } from '../config/env';
import { ServicoAuth } from './ServicoAuth';
import {
    atualizarTokensSessao,
    limparSessao,
    obterRefreshToken,
    obterRestauranteId,
    obterToken,
} from '../utils/sessao';

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

async function tentarRenovarToken(): Promise<string | undefined> {
    const refreshToken = obterRefreshToken();
    if (!refreshToken) return undefined;

    try {
        const resp = await ServicoAuth.refresh(refreshToken);
        atualizarTokensSessao(resp.token, resp.refreshToken);
        return resp.token;
    } catch (erro) {
        console.error('[requestAutenticado] Falha ao renovar token', erro);
        limparSessao();
        return undefined;
    }
}

interface RequestOptions {
    includeContentType?: boolean;
    extraHeaders?: Record<string, string>;
}

export async function requestAutenticado<T>(
    path: string,
    init?: RequestInit,
    options?: RequestOptions,
    tokenOverride?: string,
    jaTentouRefresh = false,
): Promise<T> {
    if (!API_BASE) throw new Error('API não configurada');

    const restauranteId = obterRestauranteId();
    if (!restauranteId) {
        throw new Error('Restaurante não definido na sessão');
    }

    const token = tokenOverride ?? obterToken();

    const headers: Record<string, string> = {
        ...(options?.includeContentType === false ? {} : { 'Content-Type': 'application/json' }),
        'x-restaurante-id': restauranteId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.extraHeaders ?? {}),
    };

    const resposta = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            ...headers,
            ...(init?.headers as Record<string, string> ?? {}),
        },
    });

    const texto = await resposta.text();

    if (resposta.status === 401 && !jaTentouRefresh) {
        const novoToken = await tentarRenovarToken();
        if (novoToken) {
            return requestAutenticado<T>(path, init, options, novoToken, true);
        }
        throw new Error(texto || 'Sessão expirada, faça login novamente.');
    }

    if (!resposta.ok) {
        throw new Error(texto || 'Falha na requisição');
    }

    if ((texto ?? '') === '') {
        return undefined as T;
    }

    try {
        return JSON.parse(texto) as T;
    } catch {
        throw new Error('Resposta inválida do servidor');
    }
}

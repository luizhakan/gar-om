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

// Variável de controle para o Singleton (promessa única)
let promiseDeRefresh: Promise<string | undefined> | null = null;

async function tentarRenovarToken(): Promise<string | undefined> {
    const refreshToken = obterRefreshToken();
    if (!refreshToken) return undefined;

    // Se já existe uma tentativa em andamento, retorna a mesma promessa
    if (promiseDeRefresh) {
        return promiseDeRefresh;
    }

    promiseDeRefresh = (async () => {
        try {
            const resp = await ServicoAuth.refresh(refreshToken);
            atualizarTokensSessao(resp.token, resp.refreshToken);
            return resp.token;
        } catch (erro) {
            console.error('[requestAutenticado] Falha crítica ao renovar token', erro);
            limparSessao();
            // Opcional: Redirecionar para login via window.location ou evento
            return undefined;
        } finally {
            // Libera a variável para futuras renovações
            promiseDeRefresh = null;
        }
    })();

    return promiseDeRefresh;
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

    // Verifica restauranteId
    const restauranteId = obterRestauranteId();
    if (!restauranteId) {
        // Tratamento para não travar se for uma chamada pública ou erro de estado
        // throw new Error('Restaurante não definido na sessão');
    }

    let token = tokenOverride ?? obterToken();

    // Função auxiliar para montar headers
    const getHeaders = (tokenAtual?: string) => ({
        ...(options?.includeContentType === false ? {} : { 'Content-Type': 'application/json' }),
        'x-restaurante-id': restauranteId ?? '',
        ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}),
        ...(options?.extraHeaders ?? {}),
    });

    let resposta = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            ...getHeaders(token),
            ...(init?.headers as Record<string, string> ?? {}),
        },
    });

    // Lógica de Refresh
    if (resposta.status === 401 && !jaTentouRefresh) {
        const novoToken = await tentarRenovarToken();
        
        if (novoToken) {
            // Refaz a requisição original com o novo token
            resposta = await fetch(`${API_BASE}${path}`, {
                ...init,
                headers: {
                    ...getHeaders(novoToken),
                    ...(init?.headers as Record<string, string> ?? {}),
                },
            });
        } else {
            // Se falhou o refresh, lança erro para logout
            const texto = await resposta.text();
            throw new Error(texto || 'Sessão expirada.');
        }
    }

    const texto = await resposta.text();

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
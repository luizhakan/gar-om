import { env } from '../config/env';

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

async function request<TResponse>(
    path: string,
    body: Record<string, unknown>,
): Promise<TResponse> {
    if (!API_BASE) {
        throw new Error('API não configurada');
    }

    const resp = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const texto = await resp.text();
        throw new Error(texto || 'Falha na requisição do auth');
    }

    return resp.json() as Promise<TResponse>;
}

interface DadosAdmin { id: string; nome: string; email: string; restauranteId: string }
interface DadosCozinha { id: string; login: string; restauranteId: string }
interface DadosMaster { id: string; nome: string; email: string }

export const ServicoAuth = {
    async loginAdmin(email: string, senha: string) {
        return request<{ token: string; refreshToken: string; admin: DadosAdmin }>(
            '/auth/login',
            { email, senha },
        );
    },

    async registrarAdmin(nome: string, nomeRestaurante: string, email: string, cpfCnpj: string, senha: string) {
        return request<{ token: string; refreshToken: string; admin: DadosAdmin }>(
            '/auth/register',
            { nome, nomeRestaurante, email, cpfCnpj, senha },
        );
    },

    async loginCozinha(login: string, senha: string) {
        return request<{ token: string; refreshToken: string; cozinha: DadosCozinha }>(
            '/auth/cozinha/login',
            { login, senha },
        );
    },

    async loginMaster(email: string, senha: string) {
        return request<{ token: string; refreshToken: string; master: DadosMaster }>(
            '/auth/master/login',
            { email, senha },
        );
    },

    async refresh(refreshToken: string) {
        return request<{ token: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken },
        );
    },
};

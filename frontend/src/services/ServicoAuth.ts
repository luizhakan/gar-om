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
interface DadosCozinha { id: string; email: string; restauranteId: string }

export const ServicoAuth = {
    async loginAdmin(email: string, senha: string) {
        return request<{ token: string; admin: DadosAdmin }>(
            '/auth/admin/login',
            { email, senha },
        );
    },

    async registrarAdmin(nome: string, email: string, cpf: string, senha: string) {
        return request<{ token: string; admin: DadosAdmin }>(
            '/auth/admin/register',
            { nome, email, cpf, senha },
        );
    },

    async loginCozinha(email: string, senha: string) {
        return request<{ token: string; cozinha: DadosCozinha }>(
            '/auth/cozinha/login',
            { email, senha },
        );
    },
};

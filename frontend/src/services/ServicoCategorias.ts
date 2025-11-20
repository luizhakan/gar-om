import type { Categoria } from '../types/Categoria';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

interface CategoriaApi {
    id: string;
    nome: string;
    ordem: number;
    restauranteId: string;
}

const API_BASE = env.apiBaseUrl.replace(/\/$/, '');

function garantirBase() {
    if (API_BASE === '') throw new Error('API não configurada');
}

function garantirRestauranteId() {
    const restauranteId = obterRestauranteId();
    if (restauranteId === undefined || restauranteId === '') throw new Error('Restaurante não definido na sessão');
    return restauranteId;
}

export const ServicoCategorias = {
    async listar(): Promise<Categoria[]> {
        garantirBase();
        const restauranteId = garantirRestauranteId();
        const token = obterToken();
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-restaurante-id': restauranteId,
        };

        if (token !== undefined && token !== '') {
            headers.Authorization = `Bearer ${token}`;
        }

        const resp = await fetch(`${API_BASE}/categorias`, {
            headers,
        });

        if (!resp.ok) {
            const texto = await resp.text();
            throw new Error(texto || 'Falha ao listar categorias');
        }

        const data = (await resp.json()) as CategoriaApi[];
        return data.map((item) => ({
            id: item.id,
            nome: item.nome,
            ordem: item.ordem,
            restauranteId: item.restauranteId,
        }));
    },
};

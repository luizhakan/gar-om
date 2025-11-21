import type { Categoria } from '../types/Categoria';
import { env } from '../config/env';
import { requestAutenticado } from './requestAutenticado';
import { obterRestauranteId } from '../utils/sessao';

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

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    garantirBase();
    garantirRestauranteId();
    return requestAutenticado<T>(path, init);
}

export const ServicoCategorias = {
    async listar(): Promise<Categoria[]> {
        const data = await requestApi<CategoriaApi[]>('/categorias');
        return data.map((item) => ({
            id: item.id,
            nome: item.nome,
            ordem: item.ordem,
            restauranteId: item.restauranteId,
        }));
    },

    async criar(nome: string, ordem: number): Promise<Categoria> {
        const criada = await requestApi<CategoriaApi>('/categorias', {
            method: 'POST',
            body: JSON.stringify({ nome, ordem }),
        });

        return {
            id: criada.id,
            nome: criada.nome,
            ordem: criada.ordem,
            restauranteId: criada.restauranteId,
        };
    },
};

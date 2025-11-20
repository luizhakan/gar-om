import type { Produto } from '../types/Produto';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

interface ProdutoApi {
    id: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    idCategoria: string;
    disponivel: boolean;
    imagemUrl?: string | null;
    restauranteId: string;
}

export type ProdutoNovo = Omit<Produto, 'id' | 'restauranteId' | 'createdAt' | 'updatedAt'>;

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
        throw new Error(texto || 'Falha na requisição de produtos');
    }

    return resposta.json() as Promise<T>;
}

function mapearProdutoApi(payload: ProdutoApi): Produto {
    const preco = Number(payload.preco);
    if (Number.isNaN(preco)) {
        throw new Error('Resposta de produto com preço inválido');
    }

    return {
        id: payload.id,
        nome: payload.nome,
        descricao: payload.descricao ?? undefined,
        preco,
        idCategoria: payload.idCategoria,
        disponivel: payload.disponivel,
        imagemUrl: payload.imagemUrl ?? undefined,
        restauranteId: payload.restauranteId,
    };
}

export const ServicoProdutos = {
    async listar(): Promise<Produto[]> {
        if (!usarApi) {
            throw new Error('API não configurada');
        }
        const data = await requestApi<ProdutoApi[]>('/produtos');
        return data.map(mapearProdutoApi);
    },

    async criar(produto: ProdutoNovo): Promise<Produto> {
        if (!usarApi) throw new Error('API não configurada');

        const criado = await requestApi<ProdutoApi>('/produtos', {
            method: 'POST',
            body: JSON.stringify(produto),
        });
        return mapearProdutoApi(criado);
    },

    async atualizar(produto: Produto): Promise<Produto> {
        if (!usarApi) throw new Error('API não configurada');

        const atualizado = await requestApi<ProdutoApi>(`/produtos/${produto.id}`, {
            method: 'PATCH',
            body: JSON.stringify(produto),
        });
        return mapearProdutoApi(atualizado);
    },

    async remover(idProduto: string): Promise<void> {
        if (!usarApi) throw new Error('API não configurada');
        await requestApi<void>(`/produtos/${idProduto}`, { method: 'DELETE' });
    },

    async alternarDisponibilidade(idProduto: string): Promise<Produto> {
        if (!usarApi) throw new Error('API não configurada');

        const atualizado = await requestApi<ProdutoApi>(`/produtos/${idProduto}/disponibilidade`, {
            method: 'PATCH',
        });
        return mapearProdutoApi(atualizado);
    },
};

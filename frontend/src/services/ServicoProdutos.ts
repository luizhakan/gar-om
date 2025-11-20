import type { Produto } from '../types/Produto';
import { produtosMock } from '../mocks/cardapio';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

const CHAVE_STORAGE = 'garcom_produtos';
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
            ...(restauranteId ? { 'x-restaurante-id': restauranteId } : {}),
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

function obterProdutosStorage(): Produto[] {
    const dados = typeof window !== 'undefined'
        ? window.localStorage.getItem(CHAVE_STORAGE)
        : null;

    if (!dados) return produtosMock;

    try {
        const parsed = JSON.parse(dados) as Produto[];
        return Array.isArray(parsed) ? parsed : produtosMock;
    } catch {
        return produtosMock;
    }
}

function mapearProdutoApi(payload: any): Produto {
    return {
        id: payload.id,
        nome: payload.nome,
        descricao: payload.descricao ?? '',
        preco: Number(payload.preco) || 0,
        idCategoria: payload.idCategoria ?? payload.id_categoria ?? '',
        disponivel: payload.disponivel ?? true,
        imagemUrl: payload.imagemUrl ?? payload.imagem_url,
    };
}

export const ServicoProdutos = {
    async listar(): Promise<Produto[]> {
        if (usarApi) {
            try {
                const data = await requestApi<any[]>('/produtos');
                return data.map(mapearProdutoApi);
            } catch (error) {
                console.warn('[ServicoProdutos] Falha ao listar via API, fallback local.', error);
            }
        }

        return obterProdutosStorage();
    },

    async criar(produto: Omit<Produto, 'id'>): Promise<Produto> {
        if (!usarApi) throw new Error('API não configurada');

        const criado = await requestApi<any>('/produtos', {
            method: 'POST',
            body: JSON.stringify(produto),
        });
        return mapearProdutoApi(criado);
    },

    async atualizar(produto: Produto): Promise<Produto> {
        if (!usarApi) throw new Error('API não configurada');

        const atualizado = await requestApi<any>(`/produtos/${produto.id}`, {
            method: 'PATCH',
            body: JSON.stringify(produto),
        });
        return mapearProdutoApi(atualizado);
    },

    async remover(idProduto: string): Promise<void> {
        if (!usarApi) throw new Error('API não configurada');
        await requestApi<void>(`/produtos/${idProduto}`, { method: 'DELETE' });
    },

    async alternarDisponibilidade(idProduto: string): Promise<Produto | null> {
        if (!usarApi) throw new Error('API não configurada');

        const atualizado = await requestApi<any>(`/produtos/${idProduto}/disponibilidade`, {
            method: 'PATCH',
        });
        return mapearProdutoApi(atualizado);
    }
};

import type { Produto } from '../types/Produto';
import { produtosMock } from '../mocks/cardapio';
import { gerarIdAleatorio } from '../utils/formatadores';
import { env } from '../config/env';
import { obterRestauranteId } from '../utils/sessao';

const CHAVE_STORAGE = 'garcom_produtos';
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

function salvarProdutosStorage(produtos: Produto[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(produtos));
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
        if (usarApi) {
            try {
                const criado = await requestApi<any>('/produtos', {
                    method: 'POST',
                    body: JSON.stringify(produto),
                });
                return mapearProdutoApi(criado);
            } catch (error) {
                console.warn('[ServicoProdutos] Falha ao criar via API, salvando local.', error);
            }
        }

        const produtosAtuais = obterProdutosStorage();
        const novoProduto: Produto = { ...produto, id: gerarIdAleatorio() };
        salvarProdutosStorage([...produtosAtuais, novoProduto]);
        return novoProduto;
    },

    async atualizar(produto: Produto): Promise<Produto> {
        if (usarApi) {
            try {
                const atualizado = await requestApi<any>(`/produtos/${produto.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(produto),
                });
                return mapearProdutoApi(atualizado);
            } catch (error) {
                console.warn('[ServicoProdutos] Falha ao atualizar via API, salvando local.', error);
            }
        }

        const produtosAtuais = obterProdutosStorage().map(item =>
            item.id === produto.id ? produto : item
        );
        salvarProdutosStorage(produtosAtuais);
        return produto;
    },

    async remover(idProduto: string): Promise<void> {
        if (usarApi) {
            try {
                await requestApi<void>(`/produtos/${idProduto}`, { method: 'DELETE' });
                return;
            } catch (error) {
                console.warn('[ServicoProdutos] Falha ao remover via API, removendo local.', error);
            }
        }

        const produtosAtuais = obterProdutosStorage().filter(item => item.id !== idProduto);
        salvarProdutosStorage(produtosAtuais);
    },

    async alternarDisponibilidade(idProduto: string): Promise<Produto | null> {
        if (usarApi) {
            try {
                const atualizado = await requestApi<any>(`/produtos/${idProduto}/disponibilidade`, {
                    method: 'PATCH',
                });
                return mapearProdutoApi(atualizado);
            } catch (error) {
                console.warn('[ServicoProdutos] Falha ao alternar via API, fazendo local.', error);
            }
        }

        const produtosAtuais = obterProdutosStorage().map(item =>
            item.id === idProduto ? { ...item, disponivel: !item.disponivel } : item
        );
        const produtoAtualizado = produtosAtuais.find(p => p.id === idProduto) ?? null;
        salvarProdutosStorage(produtosAtuais);
        return produtoAtualizado;
    }
};

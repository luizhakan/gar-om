import type { Pedido } from '../types/Pedido';
import { gerarIdAleatorio } from '../utils/formatadores';
import { env } from '../config/env';
import { obterRestauranteId } from '../utils/sessao';

const CHAVE_STORAGE = 'garom_pedidos';
const EVENTO_ATUALIZACAO = 'pedidos-atualizados';
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
        throw new Error(texto || 'Falha na requisição de pedidos');
    }

    return resposta.json() as Promise<T>;
}

function obterPedidosStorage(): Pedido[] {
    if (typeof window === 'undefined') return [];

    const dados = window.localStorage.getItem(CHAVE_STORAGE);
    if (!dados) return [];

    try {
        const parsed = JSON.parse(dados) as Pedido[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function salvarPedidosStorage(pedidos: Pedido[]) {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pedidos));
    window.dispatchEvent(new Event(EVENTO_ATUALIZACAO));
}

function mapearPedidoApi(payload: any): Pedido {
    const itens = (payload.itens ?? []).map((item: any) => ({
        idProduto: item.idProduto ?? item.produtoId,
        quantidade: item.quantidade,
        observacao: item.observacao ?? undefined,
        produto: item.produto
            ? {
                id: item.produto.id,
                nome: item.produto.nome,
                descricao: item.produto.descricao ?? undefined,
                preco: Number(item.produto.preco) || 0,
                idCategoria: item.produto.idCategoria,
                disponivel: item.produto.disponivel,
                imagemUrl: item.produto.imagemUrl ?? undefined,
            }
            : undefined,
    }));

    return {
        id: payload.id,
        idMesa: payload.idMesa ?? payload.id_mesa,
        status: payload.status,
        itens,
        dataCriacao: payload.dataCriacao ?? payload.data_criacao ?? new Date().toISOString(),
        dataAtualizacao: payload.dataAtualizacao ?? payload.data_atualizacao,
    };
}

export const ServicoPedidos = {
    async listar(): Promise<Pedido[]> {
        if (usarApi) {
            try {
                const data = await requestApi<any[]>('/pedidos');
                return data.map(mapearPedidoApi);
            } catch (error) {
                console.warn('[ServicoPedidos] Falha ao listar via API, fallback local.', error);
            }
        }

        return obterPedidosStorage();
    },

    async criar(pedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao'>): Promise<Pedido> {
        const dataCriacao = new Date().toISOString();

        if (usarApi) {
            try {
                const data = await requestApi<any>('/pedidos', {
                    method: 'POST',
                    body: JSON.stringify(pedido),
                });
                return mapearPedidoApi(data);
            } catch (error) {
                console.warn('[ServicoPedidos] Falha ao criar via API, salvando local.', error);
            }
        }

        const pedidosAtuais = obterPedidosStorage();

        const novoPedido: Pedido = {
            ...pedido,
            id: gerarIdAleatorio(),
            status: 'pendente',
            dataCriacao,
        };

        salvarPedidosStorage([...pedidosAtuais, novoPedido]);

        return novoPedido;
    },

    async atualizarStatus(idPedido: string, status: Pedido['status']): Promise<Pedido[]> {
        const dataAtualizacao = new Date().toISOString();

        if (usarApi) {
            try {
                await requestApi(`/pedidos/${idPedido}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status }),
                });
                return ServicoPedidos.listar();
            } catch (error) {
                console.warn('[ServicoPedidos] Falha ao atualizar via API, salvando local.', error);
            }
        }

        const pedidosAtualizados = obterPedidosStorage().map(pedido =>
            pedido.id === idPedido
                ? { ...pedido, status, dataAtualizacao }
                : pedido
        );

        salvarPedidosStorage(pedidosAtualizados);
        return pedidosAtualizados;
    },

    assinarMudancas(callback: (pedidos: Pedido[]) => void) {
        let ativo = true;

        const carregar = () => {
            ServicoPedidos.listar()
                .then((lista) => { if (ativo) callback(lista); })
                .catch((erro) => console.error('[ServicoPedidos] Erro ao carregar pedidos', erro));
        };

        if (usarApi) {
            carregar();
            const intervalo = window.setInterval(carregar, 2000);
            return () => {
                ativo = false;
                window.clearInterval(intervalo);
            };
        }

        const handler = () => callback(obterPedidosStorage());

        window.addEventListener('storage', handler);
        window.addEventListener(EVENTO_ATUALIZACAO, handler);

        carregar();

        return () => {
            ativo = false;
            window.removeEventListener('storage', handler);
            window.removeEventListener(EVENTO_ATUALIZACAO, handler);
        };
    }
};

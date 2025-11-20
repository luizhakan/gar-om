import type { Pedido, StatusPedido } from '../types/Pedido';
import { gerarIdAleatorio } from '../utils/formatadores';
import { env } from '../config/env';
import { obterRestauranteId, obterToken } from '../utils/sessao';

type PedidoApi = {
    id: string;
    idMesa: string;
    restauranteId: string;
    status: StatusPedido;
    dataCriacao: string;
    dataAtualizacao?: string | null;
    itens: ItemPedidoApi[];
};

type ItemPedidoApi = {
    produtoId: string;
    quantidade: number;
    observacao?: string | null;
    produto?: {
        id: string;
        nome: string;
        descricao?: string | null;
        preco: number;
        idCategoria: string;
        disponivel: boolean;
        imagemUrl?: string | null;
        restauranteId: string;
    };
};

const CHAVE_STORAGE = 'garom_pedidos';
const EVENTO_ATUALIZACAO = 'pedidos-atualizados';
const API_BASE = env.apiBaseUrl?.replace(/\/$/, '') ?? '';
const usarApi = Boolean(API_BASE);

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
    if (!usarApi) {
        throw new Error('API não configurada');
    }

    const restauranteId = obterRestauranteId();
    const token = obterToken();
    if (!restauranteId || !token) {
        throw new Error('Sessão de restaurante não definida');
    }

    const resposta = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-restaurante-id': restauranteId,
            Authorization: `Bearer ${token}`,
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

function mapearPedidoApi(payload: PedidoApi): Pedido {
    const itens = (payload.itens ?? []).map((item) => ({
        idProduto: item.produtoId,
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
                restauranteId: item.produto.restauranteId,
            }
            : undefined,
    }));

    return {
        id: payload.id,
        idMesa: payload.idMesa,
        restauranteId: payload.restauranteId,
        status: payload.status,
        itens,
        dataCriacao: payload.dataCriacao,
        dataAtualizacao: payload.dataAtualizacao ?? undefined,
    };
}

export const ServicoPedidos = {
    async listar(): Promise<Pedido[]> {
        if (usarApi) {
            const data = await requestApi<PedidoApi[]>('/pedidos');
            return data.map(mapearPedidoApi);
        }

        return obterPedidosStorage();
    },

    async criar(pedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao'>): Promise<Pedido> {
        const dataCriacao = new Date().toISOString();
        const restauranteId = obterRestauranteId();

        if (usarApi) {
            const data = await requestApi<PedidoApi>('/pedidos', {
                method: 'POST',
                body: JSON.stringify(pedido),
            });
            return mapearPedidoApi(data);
        }

        if (!restauranteId) {
            throw new Error('Restaurante não definido na sessão');
        }

        const pedidosAtuais = obterPedidosStorage();

        const novoPedido: Pedido = {
            ...pedido,
            restauranteId,
            id: gerarIdAleatorio(),
            status: 'pendente',
            dataCriacao,
        };

        salvarPedidosStorage([...pedidosAtuais, novoPedido]);

        return novoPedido;
    },

    async atualizarStatus(idPedido: string, status: StatusPedido): Promise<Pedido[]> {
        const dataAtualizacao = new Date().toISOString();

        if (!usarApi) {
            const pedidosAtualizados = obterPedidosStorage().map(pedido =>
                pedido.id === idPedido
                    ? { ...pedido, status, dataAtualizacao }
                    : pedido
            );

            salvarPedidosStorage(pedidosAtualizados);
            return pedidosAtualizados;
        }

        await requestApi(`/pedidos/${idPedido}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        return ServicoPedidos.listar();
    },

    assinarMudancas(callback: (pedidos: Pedido[]) => void) {
        let ativo = true;
        const restauranteId = obterRestauranteId();
        const token = obterToken();

        if (usarApi && (!restauranteId || !token)) {
            console.warn('[ServicoPedidos] Sessão ausente para assinar mudanças');
            return () => {};
        }

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
    },
};

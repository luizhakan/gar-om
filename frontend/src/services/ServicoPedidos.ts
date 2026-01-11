import type { Pedido, StatusPedido } from '../types/Pedido';
import { gerarIdAleatorio } from '../utils/formatadores';
import { env } from '../config/env';
import { definirComandaSessao, obterCodigoComanda, obterRestauranteId, obterToken, obterTokenComanda } from '../utils/sessao';
import { requestAutenticado } from './requestAutenticado';

interface PedidoApi {
    id: string;
    idMesa: string;
    comandaId?: string;
    restauranteId: string;
    status: StatusPedido;
    dataCriacao: string;
    dataAtualizacao?: string | null;
    itens: ItemPedidoApi[];
}

interface ItemPedidoApi {
    produtoId: string;
    quantidade: number;
    observacao?: string | null;
    precoUnitario?: number;
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
}

const CHAVE_STORAGE = 'garom_pedidos';
const EVENTO_ATUALIZACAO = 'pedidos-atualizados';
const API_BASE = env.apiBaseUrl.replace(/\/$/, '');
const usarApi = Boolean(API_BASE);

async function requestStatusPublico(idPedido: string): Promise<PedidoApi> {
    if (!usarApi) {
        throw new Error('API não configurada');
    }
    const restauranteId = obterRestauranteId();
    if ((restauranteId ?? '') === '') {
        throw new Error('Restaurante não definido na sessão');
    }

    const tokenComanda = obterTokenComanda();

    const resposta = await fetch(`${API_BASE}/pedidos/${idPedido}/status-publico`, {
        headers: {
            'Content-Type': 'application/json',
            'x-restaurante-id': restauranteId ?? '',
            ...(tokenComanda ? { 'x-comanda-token': tokenComanda } : {}),
        },
    });

    const texto = await resposta.text();
    if (!resposta.ok) {
        throw new Error(texto || 'Falha ao obter status do pedido');
    }
    return JSON.parse(texto) as PedidoApi;
}

async function requestApi<T>(
    path: string,
    init?: RequestInit,
    tokenOverride?: string,
    extraHeaders?: Record<string, string>,
): Promise<T> {
    if (!usarApi) {
        throw new Error('API não configurada');
    }

    return requestAutenticado<T>(path, init, { extraHeaders }, tokenOverride);
}

function obterPedidosStorage(): Pedido[] {
    if (typeof window === 'undefined') return [];

    const dados = window.localStorage.getItem(CHAVE_STORAGE);
    if ((dados ?? '') === '') return [];

    try {
        const parsed = JSON.parse(dados ?? '') as Pedido[];
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
    const itens = payload.itens.map((item) => ({
        idProduto: item.produtoId,
        quantidade: item.quantidade,
        observacao: item.observacao ?? undefined,
        precoUnitario: item.precoUnitario ?? item.produto?.preco,
        produto: item.produto
            ? {
                id: item.produto.id,
                nome: item.produto.nome,
                descricao: item.produto.descricao ?? undefined,
                preco: item.produto.preco || item.precoUnitario || 0,
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
        comandaId: payload.comandaId,
        restauranteId: payload.restauranteId,
        status: payload.status,
        itens,
        dataCriacao: payload.dataCriacao,
        dataAtualizacao: payload.dataAtualizacao ?? undefined,
    };
}

export const ServicoPedidos = {
    async listar(tokenOverride?: string): Promise<Pedido[]> {
        if (usarApi) {
            const data = await requestApi<PedidoApi[]>('/pedidos', undefined, tokenOverride);
            return data.map(mapearPedidoApi);
        }

        return obterPedidosStorage();
    },

    async criar(pedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao'>): Promise<Pedido> {
        const dataCriacao = new Date().toISOString();
        const restauranteId = obterRestauranteId();

        if (usarApi) {
            const tokenComanda = obterTokenComanda();
            const data = await requestApi<any>('/pedidos', {
                method: 'POST',
                body: JSON.stringify(pedido),
            }, undefined, tokenComanda ? { 'x-comanda-token': tokenComanda } : undefined);

            if (data?.comanda?.id && data?.comanda?.token) {
                definirComandaSessao(data.comanda.id, data.comanda.token, data.comanda.codigo);
            } else if (data?.comandaId && tokenComanda) {
                const codigoComanda = obterCodigoComanda();
                definirComandaSessao(data.comandaId, tokenComanda, codigoComanda);
            }

            const pedidoBase = data?.pedido ?? data;
            return mapearPedidoApi(pedidoBase);
        }

        if ((restauranteId ?? '') === '') {
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

    async editar(idPedido: string, pedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao'>): Promise<Pedido> {
        if (usarApi) {
            const tokenComanda = obterTokenComanda();
            const data = await requestApi<PedidoApi>(`/pedidos/${idPedido}`, {
                method: 'PATCH',
                body: JSON.stringify(pedido),
            }, undefined, tokenComanda ? { 'x-comanda-token': tokenComanda } : undefined);
            return mapearPedidoApi(data);
        }

        const pedidosAtuais = obterPedidosStorage();
        const indice = pedidosAtuais.findIndex(p => p.id === idPedido);
        if (indice === -1) {
            throw new Error('Pedido não encontrado para edição');
        }

        const original = pedidosAtuais[indice];
        const atualizado: Pedido = {
            ...original,
            ...pedido,
            status: 'pendente',
            dataAtualizacao: new Date().toISOString(),
        };

        const novos = [...pedidosAtuais];
        novos[indice] = atualizado;
        salvarPedidosStorage(novos);
        return atualizado;
    },

    async obterStatusPublico(idPedido: string): Promise<Pedido> {
        const data = await requestStatusPublico(idPedido);
        return mapearPedidoApi(data);
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

    assinarMudancas(callback: (pedidos: Pedido[]) => void, tokenOverride?: string) {
        let ativo = true;
        const restauranteId = obterRestauranteId();
        const token = tokenOverride ?? obterToken();

        if (usarApi && ((restauranteId ?? '') === '' || (token ?? '') === '')) {
            console.warn('[ServicoPedidos] Sessão ausente para assinar mudanças');
            return () => { /* no-op */ };
        }

        const carregar = () => {
            ServicoPedidos.listar(tokenOverride)
                .then((lista) => { if (ativo) callback(lista); })
                .catch((erro: unknown) => { console.error('[ServicoPedidos] Erro ao carregar pedidos', erro); });
        };

        if (usarApi) {
            carregar();
            const intervalo = window.setInterval(carregar, 2000);
            return () => {
                ativo = false;
                window.clearInterval(intervalo);
            };
        }

        const handler = () => { callback(obterPedidosStorage()); };

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

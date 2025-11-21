import type { Produto } from './Produto';

export type StatusPedido = 'pendente' | 'preparando' | 'pronto';

export interface ItemPedido {
    idProduto: string;
    produto?: Produto;
    quantidade: number;
    observacao?: string;
    precoUnitario?: number;
}

export interface Pedido {
    id: string;
    idMesa: string;
    restauranteId?: string;
    itens: ItemPedido[];
    status: StatusPedido;
    encerrado?: boolean; // Novo campo
    dataCriacao: string;
    dataAtualizacao?: string;
}
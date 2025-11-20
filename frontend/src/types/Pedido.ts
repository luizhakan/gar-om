import type { Produto } from './Produto';

export type StatusPedido = 'pendente' | 'preparando' | 'pronto';

export interface ItemPedido {
    idProduto: string;
    produto?: Produto;
    quantidade: number;
    observacao?: string;
}

export interface Pedido {
    id: string;
    idMesa: string;
    restauranteId?: string;
    itens: ItemPedido[];
    status: StatusPedido;
    dataCriacao: string;
    dataAtualizacao?: string;
}

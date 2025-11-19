import type { Produto } from './Produto';

export type StatusPedido = 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';

export interface ItemPedido {
    idProduto: string;
    produto?: Produto; // Opcional pois pode vir apenas o ID do banco
    quantidade: number;
    observacao?: string;
}

export interface Pedido {
    id: string;
    idMesa: string;
    itens: ItemPedido[];
    status: StatusPedido;
    dataCriacao: string; // ISO Date string
    dataAtualizacao?: string;
}

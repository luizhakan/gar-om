import { createContext } from 'react';
import type { Produto } from '../types/Produto';
import type { ItemPedido } from '../types/Pedido';

export interface ItemCarrinho extends ItemPedido {
    produto: Produto;
}

export interface DadosContextoCarrinho {
    itens: ItemCarrinho[];
    adicionarItem: (produto: Produto, observacao?: string) => void;
    removerItem: (idProduto: string) => void;
    atualizarQuantidade: (idProduto: string, quantidade: number) => void;
    atualizarObservacao: (idProduto: string, observacao: string) => void;
    limparCarrinho: () => void;
    total: number;
    quantidadeTotal: number;
}

export const ContextoCarrinho = createContext<DadosContextoCarrinho | undefined>(undefined);

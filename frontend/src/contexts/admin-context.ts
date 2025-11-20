import { createContext } from 'react';
import type { Produto } from '../types/Produto';
import type { Categoria } from '../types/Categoria';
import type { Mesa } from '../types/Mesa';
import type { ProdutoNovo } from '../services/ServicoProdutos';

export interface DadosContextoAdmin {
    autenticado: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => void;
    categorias: Categoria[];
    produtos: Produto[];
    criarProduto: (produto: ProdutoNovo) => Promise<void>;
    atualizarProduto: (produto: Produto) => Promise<void>;
    removerProduto: (idProduto: string) => Promise<void>;
    alternarDisponibilidade: (idProduto: string) => Promise<void>;
    mesas: Mesa[];
    definirNumeroMesas: (total: number) => Promise<void>;
    gerarLinkMesa: (numeroMesa: number) => string;
    restauranteId?: string;
    adminEmail?: string;
}

export const ContextoAdmin = createContext<DadosContextoAdmin | undefined>(undefined);

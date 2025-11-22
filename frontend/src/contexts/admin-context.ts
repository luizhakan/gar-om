import { createContext } from 'react';
import type { Produto } from '../types/Produto';
import type { Categoria } from '../types/Categoria';
import type { Mesa } from '../types/Mesa';
import type { ProdutoNovo } from '../services/ServicoProdutos';
import type { UsuarioCozinha } from '../types/UsuarioCozinha';

export interface DadosContextoAdmin {
    autenticado: boolean;
    login: (email: string, senha: string) => Promise<void>;
    logout: () => void;
    categorias: Categoria[];
    criarCategoria: (nome: string, ordem: number) => Promise<void>;
    produtos: Produto[];
    criarProduto: (produto: ProdutoNovo) => Promise<void>;
    atualizarProduto: (produto: Produto) => Promise<void>;
    removerProduto: (idProduto: string) => Promise<void>;
    alternarDisponibilidade: (idProduto: string) => Promise<void>;
    mesas: Mesa[];
    adicionarMesa: (numero: number) => Promise<void>;
    excluirMesa: (id: string) => Promise<void>;
    definirNumeroMesas: (total: number) => Promise<void>;
    fecharMesa: (id: string) => Promise<void>;
    gerarLinkMesa: (numeroMesa: number) => string;
    restauranteId?: string;
    adminEmail?: string;
    usuarioCozinha?: UsuarioCozinha | null;
    carregandoUsuarioCozinha: boolean;
    criarUsuarioCozinha: () => Promise<UsuarioCozinha>;
    recarregarUsuarioCozinha: () => Promise<void>;
    alterarSenhaUsuarioCozinha: (novaSenha: string) => Promise<UsuarioCozinha>;
}

export const ContextoAdmin = createContext<DadosContextoAdmin | undefined>(undefined);

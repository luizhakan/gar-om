import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Produto } from '../types/Produto';
import type { Categoria } from '../types/Categoria';
import type { Mesa } from '../types/Mesa';
import { categoriasMock } from '../mocks/cardapio';
import { ServicoProdutos } from '../services/ServicoProdutos';
import { ServicoMesas } from '../services/ServicoMesas';

interface DadosContextoAdmin {
    autenticado: boolean;
    login: (senha: string) => void;
    logout: () => void;
    categorias: Categoria[];
    produtos: Produto[];
    criarProduto: (produto: Omit<Produto, 'id'>) => Promise<void>;
    atualizarProduto: (produto: Produto) => Promise<void>;
    removerProduto: (idProduto: string) => Promise<void>;
    alternarDisponibilidade: (idProduto: string) => Promise<void>;
    mesas: Mesa[];
    definirNumeroMesas: (total: number) => Promise<void>;
    gerarLinkMesa: (numeroMesa: number) => string;
}

const CHAVE_STORAGE_AUTH = 'garcom_admin_auth';

const ContextoAdmin = createContext<DadosContextoAdmin>({} as DadosContextoAdmin);

interface ProvedorAdminProps {
    children: ReactNode;
}

function lerStorage<T>(chave: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;

    const dados = window.localStorage.getItem(chave);
    if (!dados) return fallback;

    try {
        return JSON.parse(dados) as T;
    } catch {
        return fallback;
    }
}

export function ProvedorAdmin({ children }: ProvedorAdminProps) {
    const [autenticado, setAutenticado] = useState<boolean>(() => {
        return lerStorage<boolean>(CHAVE_STORAGE_AUTH, false);
    });
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);

    const categorias = useMemo(() => categoriasMock, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(CHAVE_STORAGE_AUTH, JSON.stringify(autenticado));
    }, [autenticado]);

    useEffect(() => {
        ServicoProdutos.listar()
            .then(setProdutos)
            .catch((erro) => {
                console.error('[ContextoAdmin] Erro ao carregar produtos:', erro);
            });
    }, []);

    useEffect(() => {
        ServicoMesas.listar()
            .then(setMesas)
            .catch((erro) => {
                console.error('[ContextoAdmin] Erro ao carregar mesas:', erro);
            });
    }, []);

    function login(senha: string) {
        // Login fictício: qualquer senha não vazia autoriza.
        if (senha.trim().length > 0) {
            setAutenticado(true);
        }
    }

    function logout() {
        setAutenticado(false);
    }

    async function criarProduto(produto: Omit<Produto, 'id'>) {
        const criado = await ServicoProdutos.criar(produto);
        setProdutos(lista => [...lista, criado]);
    }

    async function atualizarProduto(produto: Produto) {
        const atualizado = await ServicoProdutos.atualizar(produto);
        setProdutos(lista =>
            lista.map(item => item.id === atualizado.id ? atualizado : item)
        );
    }

    async function removerProduto(idProduto: string) {
        await ServicoProdutos.remover(idProduto);
        setProdutos(lista => lista.filter(item => item.id !== idProduto));
    }

    async function alternarDisponibilidade(idProduto: string) {
        const atualizado = await ServicoProdutos.alternarDisponibilidade(idProduto);
        if (!atualizado) return;

        setProdutos(lista =>
            lista.map(item => item.id === atualizado.id ? atualizado : item)
        );
    }

    function gerarLinkMesa(numeroMesa: number) {
        const mesa = mesas.find(m => m.numero === numeroMesa);
        if (mesa?.codigoQr) return mesa.codigoQr;

        const base = typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost:5173';
        return `${base}/mesa/${numeroMesa}`;
    }

    async function definirNumeroMesas(total: number) {
        const mesasNovas = await ServicoMesas.configurar(total);
        setMesas(mesasNovas);
    }

    return (
        <ContextoAdmin.Provider
            value={{
                autenticado,
                login,
                logout,
                categorias,
                produtos,
                criarProduto,
                atualizarProduto,
                removerProduto,
                alternarDisponibilidade,
                mesas,
                definirNumeroMesas,
                gerarLinkMesa
            }}
        >
            {children}
        </ContextoAdmin.Provider>
    );
}

export function useAdmin() {
    const contexto = useContext(ContextoAdmin);

    if (!contexto) {
        throw new Error('useAdmin deve ser usado dentro de um ProvedorAdmin');
    }

    return contexto;
}

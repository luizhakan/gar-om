import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Produto } from '../types/Produto';
import type { Categoria } from '../types/Categoria';
import type { Mesa } from '../types/Mesa';
import { ServicoProdutos, type ProdutoNovo } from '../services/ServicoProdutos';
import { ServicoMesas } from '../services/ServicoMesas';
import { ServicoAuth } from '../services/ServicoAuth';
import { definirSessao, limparSessao, obterEmailSessao, obterRestauranteId, obterToken } from '../utils/sessao';
import { useToast } from './ContextoToast';
import { ServicoCategorias } from '../services/ServicoCategorias';
import { ContextoAdmin } from './admin-context';

interface ProvedorAdminProps {
    children: ReactNode;
}

export function ProvedorAdmin({ children }: ProvedorAdminProps) {
    const { notificar } = useToast();
    const sessaoInicial = useMemo(() => ({
        restauranteId: obterRestauranteId(),
        token: obterToken(),
        email: obterEmailSessao(),
    }), []);

    const [autenticado, setAutenticado] = useState<boolean>(() => Boolean(sessaoInicial.token));
    const [restauranteId, setRestauranteId] = useState<string | undefined>(() => sessaoInicial.restauranteId);
    const [adminEmail, setAdminEmail] = useState<string | undefined>(() => sessaoInicial.email);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);

    const [categorias, setCategorias] = useState<Categoria[]>([]);

    useEffect(() => {
        if (!autenticado || restauranteId === undefined) return;

        ServicoProdutos.listar()
            .then(setProdutos)
            .catch((erro: unknown) => {
                console.error('[ContextoAdmin] Erro ao carregar produtos:', erro);
                notificar('Não foi possível carregar os produtos', 'erro');
            });
    }, [autenticado, restauranteId, notificar]);

    useEffect(() => {
        if (!autenticado || restauranteId === undefined) return;

        ServicoMesas.listar()
            .then(setMesas)
            .catch((erro: unknown) => {
                console.error('[ContextoAdmin] Erro ao carregar mesas:', erro);
                notificar('Não foi possível carregar as mesas', 'erro');
            });
    }, [autenticado, restauranteId, notificar]);

    useEffect(() => {
        if (restauranteId === undefined) return;
        ServicoCategorias.listar()
            .then(setCategorias)
            .catch((erro: unknown) => {
                console.error('[ContextoAdmin] Erro ao carregar categorias:', erro);
                notificar('Não foi possível carregar as categorias', 'erro');
            });
    }, [restauranteId, notificar]);

    async function login(email: string, senha: string) {
        try {
            const resp = await ServicoAuth.loginAdmin(email, senha);
            setAutenticado(true);
            setRestauranteId(resp.admin.restauranteId);
            setAdminEmail(resp.admin.email);
            definirSessao(resp.admin.restauranteId, 'admin', resp.token, resp.admin.email);
            notificar(`Bem-vindo, ${resp.admin.nome}`, 'sucesso');
        } catch (erro) {
            console.error('[ContextoAdmin] Falha no login', erro);
            notificar('Falha no login. Verifique email/senha.', 'erro');
            throw erro;
        }
    }

    function logout() {
        setAutenticado(false);
        setRestauranteId(undefined);
        setAdminEmail(undefined);
        setProdutos([]);
        setMesas([]);
        limparSessao();
        notificar('Sessão encerrada', 'info');
    }

    async function criarProduto(produto: ProdutoNovo) {
        const criado = await ServicoProdutos.criar(produto);
        setProdutos(lista => [...lista, criado]);
        notificar('Produto criado com sucesso', 'sucesso');
    }

    async function atualizarProduto(produto: Produto) {
        const atualizado = await ServicoProdutos.atualizar(produto);
        setProdutos(lista =>
            lista.map(item => item.id === atualizado.id ? atualizado : item)
        );
        notificar('Produto atualizado', 'info');
    }

    async function removerProduto(idProduto: string) {
        await ServicoProdutos.remover(idProduto);
        setProdutos(lista => lista.filter(item => item.id !== idProduto));
        notificar('Produto removido', 'aviso');
    }

    async function alternarDisponibilidade(idProduto: string) {
        const atualizado = await ServicoProdutos.alternarDisponibilidade(idProduto);

        setProdutos(lista => lista.map(item => (item.id === atualizado.id ? atualizado : item)));
        notificar(`Produto ${atualizado.disponivel ? 'disponível' : 'indisponível'}`, 'info');
    }

    function gerarLinkMesa(numeroMesa: number) {
        const mesa = mesas.find(m => m.numero === numeroMesa);
        const codigoQr = mesa?.codigoQr;
        if (codigoQr !== undefined && codigoQr !== '') {
            return codigoQr;
        }

        const base = typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost:5173';
        return `${base}/mesa/${String(numeroMesa)}`;
    }

    async function definirNumeroMesas(total: number) {
        const mesasNovas = await ServicoMesas.configurar(total);
        setMesas(mesasNovas);
        notificar('Mesas atualizadas com sucesso', 'sucesso');
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
                gerarLinkMesa,
                restauranteId,
                adminEmail,
            }}
        >
            {children}
        </ContextoAdmin.Provider>
    );
}



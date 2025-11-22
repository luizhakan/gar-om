import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Produto } from '../types/Produto';
import type { Categoria } from '../types/Categoria';
import type { Mesa } from '../types/Mesa';
import { ServicoProdutos, type ProdutoNovo } from '../services/ServicoProdutos';
import { ServicoMesas } from '../services/ServicoMesas';
import { ServicoAuth } from '../services/ServicoAuth';
import { ServicoRealtime } from '../services/ServicoRealtime';
import { ServicoUsuariosCozinha } from '../services/ServicoUsuariosCozinha';
import { definirSessao, limparSessao, obterEmailSessao, obterRestauranteId, obterTipoSessao, obterToken } from '../utils/sessao';
import { useToast } from './ContextoToast';
import { ServicoCategorias } from '../services/ServicoCategorias';
import { ContextoAdmin } from './admin-context';
import type { UsuarioCozinha } from '../types/UsuarioCozinha';

interface ProvedorAdminProps {
    children: ReactNode;
}

export function ProvedorAdmin({ children }: ProvedorAdminProps) {
    const { notificar } = useToast();
    const sessaoInicial = useMemo(() => ({
        restauranteId: obterRestauranteId(),
        token: obterToken(),
        email: obterEmailSessao(),
        tipo: obterTipoSessao(),
    }), []);

    const sessaoEhAdmin = sessaoInicial.tipo === 'admin';

    const [autenticado, setAutenticado] = useState<boolean>(() => Boolean(sessaoInicial.token) && sessaoEhAdmin);
    const [restauranteId, setRestauranteId] = useState<string | undefined>(() => (
        sessaoEhAdmin ? sessaoInicial.restauranteId : undefined
    ));
    const [adminEmail, setAdminEmail] = useState<string | undefined>(() => (
        sessaoEhAdmin ? sessaoInicial.email : undefined
    ));
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [usuarioCozinha, setUsuarioCozinha] = useState<UsuarioCozinha | null | undefined>(undefined);
    const [carregandoUsuarioCozinha, setCarregandoUsuarioCozinha] = useState(false);

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

    useEffect(() => {
        if (!autenticado || restauranteId === undefined) {
            setUsuarioCozinha(undefined);
            return;
        }

        setCarregandoUsuarioCozinha(true);
        ServicoUsuariosCozinha.obter()
            .then(setUsuarioCozinha)
            .catch((erro: unknown) => {
                console.error('[ContextoAdmin] Erro ao carregar usuário da cozinha:', erro);
                setUsuarioCozinha(null);
                notificar('Não foi possível carregar o acesso da cozinha', 'erro');
            })
            .finally(() => {
                setCarregandoUsuarioCozinha(false);
            });
    }, [autenticado, restauranteId, notificar]);

    useEffect(() => {
        if (!autenticado || restauranteId === undefined) return;
        const socket = ServicoRealtime.conectar();

        const onMesaAtualizada = (
            payload: { idMesa: string; ocupada: boolean; contaSolicitada?: boolean; numeroMesa?: number }
        ) => {
            setMesas(lista => {
                const mesaAnterior = lista.find(m => m.id === payload.idMesa);
                const contaAntes = mesaAnterior?.contaSolicitada ?? false;
                const contaAgora = payload.contaSolicitada ?? false;

                if (contaAgora && !contaAntes) {
                    const numeroMesa = payload.numeroMesa ?? mesaAnterior?.numero;
                    const descricaoMesa = numeroMesa ? `Mesa ${numeroMesa}` : 'Uma mesa';
                    notificar(`${descricaoMesa} solicitou a conta`, 'info');
                }

                return lista.map(m => (
                    m.id === payload.idMesa
                        ? { ...m, ocupada: payload.ocupada, contaSolicitada: payload.contaSolicitada ?? false }
                        : m
                ));
            });
        };

        socket.on('mesa-status-atualizado', onMesaAtualizada);
        return () => {
            socket.off('mesa-status-atualizado', onMesaAtualizada);
        };
    }, [autenticado, restauranteId, notificar]);

    async function login(email: string, senha: string) {
        try {
            const resp = await ServicoAuth.loginAdmin(email, senha);
            setAutenticado(true);
            setRestauranteId(resp.admin.restauranteId);
            setAdminEmail(resp.admin.email);
            definirSessao(resp.admin.restauranteId, 'admin', resp.token, resp.admin.email, resp.refreshToken);
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
        setCategorias([]);
        setUsuarioCozinha(undefined);
        setCarregandoUsuarioCozinha(false);
        limparSessao();
        notificar('Sessão encerrada', 'info');
    }

    async function criarProduto(produto: ProdutoNovo) {
        const criado = await ServicoProdutos.criar(produto);
        setProdutos(lista => [...lista, criado]);
        notificar('Produto criado com sucesso', 'sucesso');
    }

    async function criarCategoria(nome: string, ordem: number) {
        const criada = await ServicoCategorias.criar(nome, ordem);
        setCategorias(lista => [...lista, criada].sort((a, b) => a.ordem - b.ordem));
        notificar('Categoria criada com sucesso', 'sucesso');
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

    async function adicionarMesa(numero: number) {
        const novaMesa = await ServicoMesas.adicionarMesa(numero);
        setMesas(lista => [...lista, novaMesa]);
        notificar('Mesa adicionada com sucesso', 'sucesso');
    }

    async function fecharMesa(id: string) {
        const mesa = await ServicoMesas.fecharMesa(id);
        setMesas(lista => lista.map(m => m.id === mesa.id ? mesa : m));
        notificar(`Mesa ${mesa.numero} fechada`, 'info');
    }

    async function definirNumeroMesas(total: number) {
        const novasMesas = await ServicoMesas.configurarMesas(total);
        setMesas(novasMesas);
        notificar('Mesas atualizadas com sucesso', 'info');
    }

    async function excluirMesa(id: string) {
        await ServicoMesas.excluirMesa(id);
        setMesas(lista => lista.filter(mesa => mesa.id !== id));
        notificar('Mesa excluída com sucesso', 'aviso');
    }

    async function recarregarUsuarioCozinha() {
        setCarregandoUsuarioCozinha(true);
        try {
            const usuario = await ServicoUsuariosCozinha.obter();
            setUsuarioCozinha(usuario);
        } catch (erro) {
            console.error('[ContextoAdmin] Falha ao recarregar usuário da cozinha', erro);
            setUsuarioCozinha(null);
            notificar('Não foi possível carregar o usuário da cozinha', 'erro');
            throw erro;
        } finally {
            setCarregandoUsuarioCozinha(false);
        }
    }

    async function criarUsuarioCozinha() {
        if (carregandoUsuarioCozinha) {
            throw new Error('Aguarde terminar o carregamento antes de criar o usuário.');
        }
        if (usuarioCozinha) {
            throw new Error('Já existe um usuário da cozinha para este restaurante.');
        }

        const criado = await ServicoUsuariosCozinha.criar();
        setUsuarioCozinha(criado);
        notificar('Usuário da cozinha criado com sucesso', 'sucesso');
        return criado;
    }

    async function alterarSenhaUsuarioCozinha(novaSenha: string) {
        const atualizado = await ServicoUsuariosCozinha.alterarSenha(novaSenha);
        setUsuarioCozinha(atualizado);
        notificar('Senha da cozinha atualizada', 'info');
        return atualizado;
    }

    return (
        <ContextoAdmin.Provider
            value={{
                autenticado,
                login,
                logout,
                categorias,
                criarCategoria,
                produtos,
                criarProduto,
                atualizarProduto,
                removerProduto,
                alternarDisponibilidade,
                mesas,
                adicionarMesa,
                excluirMesa,
                definirNumeroMesas,
                fecharMesa,
                gerarLinkMesa,
                restauranteId,
                adminEmail,
                usuarioCozinha,
                carregandoUsuarioCozinha,
                criarUsuarioCozinha,
                recarregarUsuarioCozinha,
                alterarSenhaUsuarioCozinha,
            }}
        >
            {children}
        </ContextoAdmin.Provider>
    );
}

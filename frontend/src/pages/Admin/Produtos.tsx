import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { CardProdutoAdmin } from '../../components/CardProdutoAdmin';
import { Botao } from '../../components/Botao';
import styles from './Produtos.module.css';

interface EstadoFormulario {
    id?: string;
    nome: string;
    descricao: string;
    preco: string;
    idCategoria: string;
    disponivel: boolean;
}

const estadoInicial: EstadoFormulario = {
    nome: '',
    descricao: '',
    preco: '',
    idCategoria: '',
    disponivel: true,
};

export function ProdutosAdmin() {
    const { produtos, categorias, criarProduto, atualizarProduto, removerProduto, alternarDisponibilidade, restauranteId } = useAdmin();
    const [form, setForm] = useState<EstadoFormulario>(estadoInicial);
    const [modalAberto, setModalAberto] = useState(false);
    const [busca, setBusca] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');

    const categoriasOrdenadas = useMemo(
        () => [...categorias].sort((a, b) => a.ordem - b.ordem),
        [categorias]
    );

    const produtosFiltrados = useMemo(() => {
        return produtos.filter(p => {
            const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || 
                              p.descricao?.toLowerCase().includes(busca.toLowerCase());
            const matchCategoria = filtroCategoria === '' || p.idCategoria === filtroCategoria;
            return matchBusca && matchCategoria;
        });
    }, [produtos, busca, filtroCategoria]);

    const produtosAgrupados = useMemo(() => {
        // Se houver busca ativa, não agrupamos para facilitar a visualização clara dos resultados
        if (busca !== '') return { 'Resultados da busca': produtosFiltrados };

        const grupos: Record<string, typeof produtos> = {};
        
        categoriasOrdenadas.forEach(cat => {
            const produtosDaCat = produtosFiltrados.filter(p => p.idCategoria === cat.id);
            if (produtosDaCat.length > 0) {
                grupos[cat.nome] = produtosDaCat;
            }
        });

        // Produtos sem categoria (se existirem)
        const semCategoria = produtosFiltrados.filter(p => !categorias.some(c => c.id === p.idCategoria));
        if (semCategoria.length > 0) {
            grupos['Outros'] = semCategoria;
        }

        return grupos;
    }, [produtosFiltrados, categoriasOrdenadas, categorias, busca]);

    function limparFormulario() {
        setForm(estadoInicial);
        setModalAberto(false);
    }

    function abrirNovo() {
        setForm(estadoInicial);
        setModalAberto(true);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const nome = form.nome.trim();
        const precoTexto = form.preco.trim();
        const categoriaId = form.idCategoria.trim();
        if (nome === '' || precoTexto === '' || categoriaId === '') return;

        const precoNumber = Number(precoTexto.replace(',', '.'));
        if (Number.isNaN(precoNumber)) return;
        if (restauranteId === undefined || restauranteId === '') return;

        try {
            if (form.id !== undefined && form.id !== '') {
                await atualizarProduto({
                    id: form.id,
                    nome,
                    descricao: form.descricao.trim(),
                    preco: precoNumber,
                    idCategoria: categoriaId,
                    disponivel: form.disponivel,
                    restauranteId,
                });
            } else {
                await criarProduto({
                    nome,
                    descricao: form.descricao.trim(),
                    preco: precoNumber,
                    idCategoria: categoriaId,
                    disponivel: form.disponivel,
                });
            }
        } catch (erro) {
            console.error('[ProdutosAdmin] Falha ao salvar produto', erro);
        }

        limparFormulario();
    }

    function handleEditar(idProduto: string) {
        const produto = produtos.find(p => p.id === idProduto);
        if (produto === undefined) return;

        setForm({
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao ?? '',
            preco: String(produto.preco),
            idCategoria: produto.idCategoria,
            disponivel: produto.disponivel,
        });
        setModalAberto(true);
    }

    async function handleRemover(idProduto: string) {
        const produto = produtos.find(p => p.id === idProduto);
        if (!produto) return;

        const confirmar = window.confirm(`Remover "${produto.nome}" do cardápio?`);
        if (confirmar) {
            await removerProduto(idProduto);
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Catálogo</p>
                    <h1 className={styles.titulo}>Produtos</h1>
                    <p className={styles.subtitulo}>
                        {produtos.length} {produtos.length === 1 ? 'item cadastrado' : 'itens cadastrados'} no total.
                    </p>
                </div>
                <Botao onClick={abrirNovo}>
                    + Novo Produto
                </Botao>
            </header>

            <section className={styles.toolbar}>
                <div className={styles.filtros}>
                    <div className={styles.buscaWrapper}>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou descrição..."
                            value={busca}
                            onChange={(e) => { setBusca(e.target.value); }}
                        />
                    </div>
                    <select
                        className={styles.filtroCategoria}
                        value={filtroCategoria}
                        onChange={(e) => { setFiltroCategoria(e.target.value); }}
                    >
                        <option value="">Todas as categorias</option>
                        {categoriasOrdenadas.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                    </select>
                </div>
            </section>

            {modalAberto && (
                <div className={styles.overlay}>
                    <section className={`${styles.formCard} ${styles.modal}`}>
                        <div className={styles.modalHeader}>
                            <div>
                                <p className={styles.sectionLabel}>{(form.id ?? '') !== '' ? 'Editar produto' : 'Novo produto'}</p>
                                <h2 className={styles.sectionTitle}>{(form.id ?? '') !== '' ? 'Atualize os dados' : 'Preencha para adicionar'}</h2>
                            </div>
                            <button 
                                type="button"
                                className={styles.botaoFechar}
                                onClick={limparFormulario}
                            >
                                ×
                            </button>
                        </div>
                        <form
                            className={styles.form}
                            onSubmit={(event) => {
                                void handleSubmit(event);
                            }}
                        >
                            <div className={styles.col2}>
                                <div className={styles.campo}>
                                    <label>Nome</label>
                                    <input
                                        value={form.nome}
                                        onChange={e => { setForm(f => ({ ...f, nome: e.target.value })); }}
                                        placeholder="Ex: X-Burger Clássico"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className={styles.campo}>
                                    <label>Preço (R$)</label>
                                    <input
                                        value={form.preco}
                                        onChange={e => { setForm(f => ({ ...f, preco: e.target.value })); }}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="25.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.campo}>
                                <label>Categoria</label>
                                <select
                                    value={form.idCategoria}
                                    onChange={e => { setForm(f => ({ ...f, idCategoria: e.target.value })); }}
                                    required
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categoriasOrdenadas.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.campo}>
                                <label>Descrição</label>
                                <textarea
                                    value={form.descricao}
                                    onChange={e => { setForm(f => ({ ...f, descricao: e.target.value })); }}
                                    rows={3}
                                    placeholder="Detalhes para a cozinha ou cliente"
                                />
                            </div>

                            <div className={styles.formFooter}>
                                <label className={styles.campoCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={form.disponivel}
                                        onChange={e => { setForm(f => ({ ...f, disponivel: e.target.checked })); }}
                                    />
                                    <span>Produto disponível imediatamente</span>
                                </label>

                                <div className={styles.acoesForm}>
                                    <Botao variante="secundario" onClick={limparFormulario}>
                                        Cancelar
                                    </Botao>
                                    <Botao type="submit">
                                        {(form.id ?? '') !== '' ? 'Salvar' : 'Adicionar'}
                                    </Botao>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            <section className={styles.lista}>
                {produtosFiltrados.length === 0 ? (
                    <p className={styles.vazio}>Nenhum produto encontrado.</p>
                ) : (
                    Object.entries(produtosAgrupados).map(([categoriaNome, itens]) => (
                        <div key={categoriaNome} className={styles.grupoCategoria}>
                            <h3 className={styles.categoriaTitulo}>
                                {categoriaNome} 
                                <span className={styles.contador}>{itens.length}</span>
                            </h3>
                            <div className={styles.grid}>
                                {itens.map(produto => (
                                    <CardProdutoAdmin
                                        key={produto.id}
                                        produto={produto}
                                        categoria={categoriaNome === 'Resultados da busca' || categoriaNome === 'Outros' 
                                            ? (categorias.find(c => c.id === produto.idCategoria)?.nome ?? 'Sem categoria')
                                            : categoriaNome
                                        }
                                        onEditar={() => { handleEditar(produto.id); }}
                                        onRemover={() => { void handleRemover(produto.id); }}
                                        onAlternarDisponivel={() => {
                                            void alternarDisponibilidade(produto.id)
                                                .catch((erro: unknown) => { console.error('[ProdutosAdmin] Falha ao alternar', erro); });
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}

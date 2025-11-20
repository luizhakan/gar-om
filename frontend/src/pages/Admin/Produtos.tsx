import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useAdmin } from '../../contexts/ContextoAdmin';
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

    const categoriasOrdenadas = useMemo(
        () => [...categorias].sort((a, b) => a.ordem - b.ordem),
        [categorias]
    );

    function limparFormulario() {
        setForm(estadoInicial);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!form.nome.trim() || !form.preco || !form.idCategoria) return;

        const precoNumber = Number(form.preco.replace(',', '.'));
        if (Number.isNaN(precoNumber)) return;
        if (!restauranteId) return;

        try {
            if (form.id) {
                await atualizarProduto({
                    id: form.id,
                    nome: form.nome.trim(),
                    descricao: form.descricao.trim(),
                    preco: precoNumber,
                    idCategoria: form.idCategoria,
                    disponivel: form.disponivel,
                    restauranteId,
                });
            } else {
                await criarProduto({
                    nome: form.nome.trim(),
                    descricao: form.descricao.trim(),
                    preco: precoNumber,
                    idCategoria: form.idCategoria,
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
        if (!produto) return;

        setForm({
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao ?? '',
            preco: String(produto.preco),
            idCategoria: produto.idCategoria,
            disponivel: produto.disponivel,
        });
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
                    <p className={styles.subtitulo}>Cadastre e pause itens do cardápio.</p>
                </div>
            </header>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>{form.id ? 'Editar produto' : 'Novo produto'}</p>
                    <h2 className={styles.sectionTitle}>{form.id ? 'Atualize os dados' : 'Preencha para adicionar'}</h2>
                </div>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.col2}>
                        <div className={styles.campo}>
                            <label>Nome</label>
                            <input
                                value={form.nome}
                                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                                placeholder="Ex: X-Burger Clássico"
                                required
                            />
                        </div>

                        <div className={styles.campo}>
                            <label>Preço (R$)</label>
                            <input
                                value={form.preco}
                                onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
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
                            onChange={e => setForm(f => ({ ...f, idCategoria: e.target.value }))}
                            required
                        >
                            <option value="">Selecione</option>
                            {categoriasOrdenadas.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.campo}>
                        <label>Descrição</label>
                        <textarea
                            value={form.descricao}
                            onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                            rows={3}
                            placeholder="Detalhes para a cozinha ou cliente"
                        />
                    </div>

                    <div className={styles.campoCheckbox}>
                        <input
                            id="disponivel"
                            type="checkbox"
                            checked={form.disponivel}
                            onChange={e => setForm(f => ({ ...f, disponivel: e.target.checked }))}
                        />
                        <label htmlFor="disponivel">Produto disponível imediatamente</label>
                    </div>

                    <div className={styles.acoesForm}>
                        {form.id && (
                            <Botao variante="secundario" onClick={limparFormulario}>
                                Cancelar edição
                            </Botao>
                        )}
                        <Botao type="submit">
                            {form.id ? 'Salvar alterações' : 'Adicionar produto'}
                        </Botao>
                    </div>
                </form>
            </section>

            <section className={styles.lista}>
                <h2 className={styles.sectionTitle}>Itens cadastrados</h2>
                {produtos.length === 0 ? (
                    <p className={styles.vazio}>Nenhum produto cadastrado ainda.</p>
                ) : (
                    <div className={styles.grid}>
                        {produtos.map(produto => {
                            const categoria = categorias.find(cat => cat.id === produto.idCategoria);
                            return (
                                <CardProdutoAdmin
                                    key={produto.id}
                                    produto={produto}
                                    categoria={categoria?.nome ?? 'Sem categoria'}
                                    onEditar={() => handleEditar(produto.id)}
                                    onRemover={() => handleRemover(produto.id)}
                                    onAlternarDisponivel={() => {
                                        alternarDisponibilidade(produto.id)
                                            .catch((erro) => console.error('[ProdutosAdmin] Falha ao alternar', erro));
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

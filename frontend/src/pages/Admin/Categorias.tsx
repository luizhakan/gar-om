import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Botao } from '../../components/Botao';
import styles from './Categorias.module.css';

export function CategoriasAdmin() {
    const { categorias, criarCategoria } = useAdmin();
    const categoriasOrdenadas = useMemo(
        () => [...categorias].sort((a, b) => a.ordem - b.ordem),
        [categorias]
    );

    const proximaOrdem = useMemo(() => {
        if (categoriasOrdenadas.length === 0) return 1;
        return Math.max(...categoriasOrdenadas.map(c => c.ordem)) + 1;
    }, [categoriasOrdenadas]);

    const [nome, setNome] = useState('');
    const [ordem, setOrdem] = useState(proximaOrdem);
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        setOrdem(proximaOrdem);
    }, [proximaOrdem]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const nomeTrim = nome.trim();
        if (nomeTrim === '') return;
        if (!Number.isFinite(ordem) || ordem < 1) return;

        try {
            await criarCategoria(nomeTrim, ordem);
            setNome('');
            setMensagem('Categoria criada com sucesso.');
        } catch (erro) {
            console.error('[CategoriasAdmin] Falha ao criar categoria', erro);
            setMensagem(erro instanceof Error ? erro.message : 'Erro ao criar categoria.');
        }

        window.setTimeout(() => { setMensagem(''); }, 2200);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Cardápio</p>
                    <h1 className={styles.titulo}>Categorias</h1>
                    <p className={styles.subtitulo}>Organize itens do cardápio por seção.</p>
                </div>
            </header>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Nova categoria</p>
                    <h2 className={styles.sectionTitle}>Adicionar categoria</h2>
                </div>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <label className={styles.label} htmlFor="nome-categoria">
                        Nome
                    </label>
                    <input
                        id="nome-categoria"
                        type="text"
                        value={nome}
                        onChange={e => { setNome(e.target.value); }}
                        className={styles.input}
                        placeholder="Ex: Lanches, Bebidas, Sobremesas"
                        required
                    />

                    <label className={styles.label} htmlFor="ordem-categoria">
                        Ordem
                    </label>
                    <input
                        id="ordem-categoria"
                        type="number"
                        min={1}
                        value={ordem}
                        onChange={e => { setOrdem(Number(e.target.value)); }}
                        className={styles.input}
                    />

                    <Botao type="submit" variante="primario" tamanho="grande">
                        Criar categoria
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.lista}>
                <h2 className={styles.sectionTitle}>Categorias atuais</h2>
                {categoriasOrdenadas.length === 0 ? (
                    <p className={styles.vazio}>Nenhuma categoria cadastrada ainda.</p>
                ) : (
                    <div className={styles.grid}>
                        {categoriasOrdenadas.map(categoria => (
                            <div key={categoria.id} className={styles.card}>
                                <div className={styles.badge}>#{categoria.ordem}</div>
                                <p className={styles.nome}>{categoria.nome}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

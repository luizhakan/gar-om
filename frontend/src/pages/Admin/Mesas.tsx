import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Botao } from '../../components/Botao';
import styles from './Mesas.module.css';

export function MesasAdmin() {
    const { mesas, adicionarMesa, excluirMesa, definirNumeroMesas, gerarLinkMesa, fecharMesa } = useAdmin();
    const [numeroMesa, setNumeroMesa] = useState(1);
    const [totalMesas, setTotalMesas] = useState(Math.max(1, mesas.length || 1));
    const [mensagem, setMensagem] = useState('');

    useEffect(() => {
        setTotalMesas(Math.max(1, mesas.length || 1));
    }, [mesas.length]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        try {
            await adicionarMesa(numeroMesa);
            setMensagem(`Mesa ${numeroMesa} adicionada com sucesso.`);
            setNumeroMesa(1);
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao adicionar mesa', erro);
            setMensagem('Erro ao adicionar mesa. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    async function handleConfigurar(event: FormEvent) {
        event.preventDefault();
        try {
            await definirNumeroMesas(totalMesas);
            setMensagem(`Total de mesas atualizado para ${totalMesas}.`);
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao configurar mesas', erro);
            setMensagem('Erro ao atualizar mesas. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    async function handleExcluir(id: string) {
        try {
            await excluirMesa(id);
            setMensagem('Mesa excluída com sucesso.');
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao excluir mesa', erro);
            setMensagem(erro instanceof Error ? erro.message : 'Erro ao excluir mesa. Tente novamente.');
        }
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    function copiarLink(link: string) {
        void navigator.clipboard.writeText(link);
        setMensagem('Link copiado para a área de transferência.');
        setTimeout(() => { setMensagem(''); }, 2200);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Salão</p>
                    <h1 className={styles.titulo}>Mesas e QR Code</h1>
                    <p className={styles.subtitulo}>Adicione, visualize e remova as mesas do seu restaurante.</p>
                </div>
            </header>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Nova mesa</p>
                    <h2 className={styles.sectionTitle}>Adicionar nova mesa</h2>
                </div>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <label className={styles.label} htmlFor="numero-mesa">
                        Número da mesa
                    </label>
                    <input
                        id="numero-mesa"
                        type="number"
                        min={1}
                        value={numeroMesa}
                        onChange={e => { setNumeroMesa(Number(e.target.value)); }}
                        className={styles.input}
                    />
                    <Botao type="submit" variante="primario" tamanho="grande">
                        Adicionar Mesa
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Configurar QR Codes</p>
                    <h2 className={styles.sectionTitle}>Definir quantidade total de mesas</h2>
                    <p className={styles.subtitulo}>Recria os QR Codes para o número informado, garantindo o restaurante correto.</p>
                </div>
                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleConfigurar(event);
                    }}
                >
                    <label className={styles.label} htmlFor="total-mesas">
                        Quantidade total de mesas
                    </label>
                    <input
                        id="total-mesas"
                        type="number"
                        min={1}
                        value={totalMesas}
                        onChange={e => { setTotalMesas(Number(e.target.value)); }}
                        className={styles.input}
                    />
                    <Botao type="submit" variante="secundario" tamanho="grande">
                        Atualizar QR Codes
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.lista}>
                <h2 className={styles.sectionTitle}>Mesas ativas</h2>
                {mesas.length === 0 ? (
                    <p className={styles.vazio}>Nenhuma mesa configurada ainda.</p>
                ) : (
                    <div className={styles.grid}>
                        {mesas.map(mesa => {
                            const link = gerarLinkMesa(mesa.numero);
                            const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`;

                            return (
                                <div key={mesa.id} className={styles.card}>
                                    <div className={styles.qrWrapper}>
                                        <img src={imgSrc} alt={`QR Code mesa ${String(mesa.numero)}`} />
                                    </div>
                                    <p className={styles.mesaLabel}>Mesa {mesa.numero}</p>
                                    <p className={styles.link}>{link}</p>
                                    <div className={styles.statusLinha}>
                                        <span className={styles.badgeEstado} data-ocupada={mesa.ocupada}>
                                            {mesa.ocupada ? 'Ocupada' : 'Livre'}
                                        </span>
                                        {mesa.contaSolicitada ? <span className={styles.badgeConta}>Conta solicitada</span> : null}
                                    </div>
                                    <div className={styles.acoes}>
                                        <Botao
                                            variante="secundario"
                                            tamanho="pequeno"
                                            onClick={() => { copiarLink(link); }}
                                        >
                                            Copiar link
                                        </Botao>
                                        <Botao
                                            variante="perigo"
                                            tamanho="pequeno"
                                            onClick={() => { void handleExcluir(mesa.id); }}
                                        >
                                            Excluir
                                        </Botao>
                                        {mesa.ocupada && mesa.contaSolicitada && (
                                            <Botao
                                                variante="secundario"
                                                tamanho="pequeno"
                                                onClick={() => { void fecharMesa(mesa.id); }}
                                            >
                                                Fechar sessão
                                            </Botao>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

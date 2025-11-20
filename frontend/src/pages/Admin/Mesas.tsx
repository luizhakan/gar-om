import { FormEvent, useState } from 'react';
import { useAdmin } from '../../contexts/ContextoAdmin';
import { Botao } from '../../components/Botao';
import styles from './Mesas.module.css';

export function MesasAdmin() {
    const { mesas, definirNumeroMesas, gerarLinkMesa } = useAdmin();
    const [quantidade, setQuantidade] = useState(mesas.length || 10);
    const [mensagem, setMensagem] = useState('');

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        try {
            await definirNumeroMesas(quantidade);
            setMensagem(`Geramos QR Codes para ${quantidade} mesa(s).`);
        } catch (erro) {
            console.error('[MesasAdmin] Falha ao configurar mesas', erro);
            setMensagem('Erro ao gerar mesas. Tente novamente.');
        }
        setTimeout(() => setMensagem(''), 2200);
    }

    function copiarLink(link: string) {
        navigator.clipboard?.writeText(link);
        setMensagem('Link copiado para a área de transferência.');
        setTimeout(() => setMensagem(''), 2200);
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Salão</p>
                    <h1 className={styles.titulo}>Mesas e QR Code</h1>
                    <p className={styles.subtitulo}>Defina a quantidade de mesas e compartilhe o QR.</p>
                </div>
            </header>

            <section className={styles.formCard}>
                <div>
                    <p className={styles.sectionLabel}>Configuração</p>
                    <h2 className={styles.sectionTitle}>Quantas mesas estão ativas?</h2>
                </div>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label} htmlFor="mesas">
                        Número de mesas
                    </label>
                    <input
                        id="mesas"
                        type="number"
                        min={1}
                        max={50}
                        value={quantidade}
                        onChange={e => setQuantidade(Number(e.target.value))}
                        className={styles.input}
                    />
                    <Botao type="submit" variante="primario" tamanho="grande">
                        Gerar QR Codes
                    </Botao>
                    {mensagem && <p className={styles.mensagem}>{mensagem}</p>}
                </form>
            </section>

            <section className={styles.lista}>
                <h2 className={styles.sectionTitle}>QR Codes gerados</h2>
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
                                        <img src={imgSrc} alt={`QR Code mesa ${mesa.numero}`} />
                                    </div>
                                    <p className={styles.mesaLabel}>Mesa {mesa.numero}</p>
                                    <p className={styles.link}>{link}</p>
                                    <div className={styles.acoes}>
                                        <Botao
                                            variante="secundario"
                                            tamanho="pequeno"
                                            onClick={() => copiarLink(link)}
                                        >
                                            Copiar link
                                        </Botao>
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

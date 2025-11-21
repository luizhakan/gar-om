import { useAdmin } from '../../hooks/useAdmin';
import styles from './Dashboard.module.css';

export function DashboardAdmin() {
    const { produtos, mesas } = useAdmin();
    const produtosAtivos = produtos.filter(p => p.disponivel).length;

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.rotulo}>Radar do restaurante</p>
                    <h1 className={styles.titulo}>Painel do Caixa</h1>
                    <p className={styles.subtitulo}>Produtos, mesas e QR Codes em tempo real.</p>
                </div>
                <div className={styles.badgeTempo}>
                    ⏱️ Atualiza em tempo real
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardIcone}>🍽️</div>
                    <div className={styles.cardTexto}>
                        <p className={styles.cardLabel}>Produtos cadastrados</p>
                        <h2 className={styles.cardNumero}>{produtos.length}</h2>
                        <p className={styles.cardDescricao}>Itens totais no cardápio</p>
                    </div>
                </div>
                <div className={`${styles.card} ${styles.cardDestaque}`}>
                    <div className={styles.cardIcone}>✅</div>
                    <div className={styles.cardTexto}>
                        <p className={styles.cardLabel}>Produtos ativos</p>
                        <h2 className={styles.cardNumero}>{produtosAtivos}</h2>
                        <p className={styles.cardDescricao}>Disponíveis agora para as mesas</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardIcone}>🪑</div>
                    <div className={styles.cardTexto}>
                        <p className={styles.cardLabel}>Mesas configuradas</p>
                        <h2 className={styles.cardNumero}>{mesas.length}</h2>
                        <p className={styles.cardDescricao}>QR Codes prontos para uso</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

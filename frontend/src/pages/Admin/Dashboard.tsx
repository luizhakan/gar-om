import { useAdmin } from '../../hooks/useAdmin';
import styles from './Dashboard.module.css';

export function DashboardAdmin() {
    const { produtos, mesas } = useAdmin();
    const produtosAtivos = produtos.filter(p => p.disponivel).length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <p className={styles.rotulo}>Visão geral</p>
                    <h1 className={styles.titulo}>Painel do Dono</h1>
                    <p className={styles.subtitulo}>Acompanhe produtos e mesas em tempo real.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Produtos cadastrados</p>
                    <h2 className={styles.cardNumero}>{produtos.length}</h2>
                    <p className={styles.cardDescricao}>Itens totais no cardápio</p>
                </div>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Produtos ativos</p>
                    <h2 className={styles.cardNumero}>{produtosAtivos}</h2>
                    <p className={styles.cardDescricao}>Disponíveis para a mesa</p>
                </div>
                <div className={styles.card}>
                    <p className={styles.cardLabel}>Mesas configuradas</p>
                    <h2 className={styles.cardNumero}>{mesas.length}</h2>
                    <p className={styles.cardDescricao}>QR Codes gerados</p>
                </div>
            </div>
        </div>
    );
}

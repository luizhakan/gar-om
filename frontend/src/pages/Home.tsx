import { Link } from 'react-router-dom';
import { Botao } from '../components/Botao';
import styles from './Home.module.css';

export function Home() {
    return (
        <div className={styles.shell}>
            <header className={styles.hero}>
                <div className="container">
                    <p className={styles.kicker}>Feng Shui digital para salão e cozinha</p>
                    <h1 className={styles.titulo}>Garçom ágil em 3 toques</h1>
                    <p className={styles.subtitulo}>
                        Fluxo mobile-first, escuro e rápido. Pedidos entram em tempo real na cozinha.
                    </p>

                    <div className={styles.acoesHero}>
                        <Link to="/admin/login">
                            <Botao variante="primario" tamanho="grande">🔐 Painel Admin</Botao>
                        </Link>
                        <Link to="/cozinha">
                            <Botao variante="secundario" tamanho="grande">🔥 KDS Cozinha</Botao>
                        </Link>
                    </div>

                    <div className={styles.selos}>
                        <div>
                            <span className={styles.seloLabel}>Real time</span>
                            <strong>WebSocket + Offline</strong>
                        </div>
                        <div>
                            <span className={styles.seloLabel}>Modo escuro</span>
                            <strong>Pensado para o salão</strong>
                        </div>
                        <div>
                            <span className={styles.seloLabel}>3 toques</span>
                            <strong>Padrões de polegar</strong>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className={styles.gridAcoes}>
                    <article className={styles.cardAcao}>
                        <div className={styles.cardTopo}>
                            <span className={styles.badge}>Garçom</span>
                            <p className={styles.cardTitulo}>Lançar pedido sem fricção</p>
                        </div>
                        <p className={styles.cardTexto}>
                            Busca por nome/código, botoeira grande na base da tela e feedback instantâneo.
                        </p>
                        <div className={styles.cardFooter}>
                            <Link to="/admin/login">
                                <Botao tamanho="grande">Configurar cardápio</Botao>
                            </Link>
                        </div>
                    </article>

                    <article className={styles.cardAcao}>
                        <div className={styles.cardTopo}>
                            <span className={styles.badgeAmbar}>Cozinha</span>
                            <p className={styles.cardTitulo}>KDS por cores</p>
                        </div>
                        <p className={styles.cardTexto}>
                            Verde para novos pedidos, amarelo preparando e vermelho piscando para atrasados.
                        </p>
                        <div className={styles.cardFooter}>
                            <Link to="/cozinha">
                                <Botao variante="secundario" tamanho="grande">Ver painel</Botao>
                            </Link>
                        </div>
                    </article>

                    <article className={styles.cardAcao}>
                        <div className={styles.cardTopo}>
                            <span className={styles.badgeAzul}>Mapa do salão</span>
                            <p className={styles.cardTitulo}>Mesas por status</p>
                        </div>
                        <p className={styles.cardTexto}>
                            Cores semafóricas: cinza livre, azul comendo, vermelho chamando, verde conta.
                        </p>
                        <div className={styles.cardFooter}>
                            <Link to="/admin/mesas">
                                <Botao variante="secundario" tamanho="grande">Configurar mesas</Botao>
                            </Link>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

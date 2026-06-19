import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Botao } from '../components/Botao';
import styles from './Home.module.css';

export function Home() {
    const navigate = useNavigate();
    const [modalLoginAberto, setModalLoginAberto] = useState(false);

    const abrirLogin = () => setModalLoginAberto(true);
    const fecharLogin = () => setModalLoginAberto(false);
    const irPara = (path: string) => {
        setModalLoginAberto(false);
        navigate(path);
    };

    const irParaRegistro = () => {
        console.log('Navegando para registro...');
        navigate('/admin/registro');
    };
    const irParaLogin = () => {
        console.log('Navegando para login...');
        navigate('/admin/login');
    };

    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <div className="container">
                    <div className={styles.topbarContent}>
                        <div className={styles.brand}>Garçom Ágil</div>
                        <Botao variante="secundario" tamanho="pequeno" onClick={abrirLogin}>Login</Botao>
                    </div>
                </div>
            </div>
            <header className={styles.hero}>
                <div className="container">
                    <div className={styles.heroGrid}>
                        <div className={styles.copy}>
                            <h1 className={styles.titulo}>Cadastre seu restaurante e rode 14 dias grátis no piloto automático</h1>
                            <p className={styles.subtitulo}>
                                Monte cardápio, mapa de mesas e KDS em minutos. Teste de 14 dias sem cartão.
                            </p>

                            <div className={styles.ctas}>
                                <Botao
                                    type="button"
                                    variante="primario"
                                    tamanho="grande"
                                    onClick={irParaRegistro}
                                >
                                    Começar teste de 14 dias
                                </Botao>
                                <Botao
                                    type="button"
                                    variante="secundario"
                                    tamanho="grande"
                                    onClick={irParaLogin}
                                >
                                    Já tenho conta
                                </Botao>
                            </div>
                            <p className={styles.trialMeta}>Sem cartão agora • Teste expira em 14 dias</p>
                        </div>

                        <div className={styles.heroCard}>
                            <p className={styles.cardTitle}>Fluxo completo para restaurante, cozinha e assinaturas</p>
                            <ul className={styles.cardList}>
                                <li>Pedidos e status em tempo real</li>
                                <li>KDS responsivo com cores semáforo</li>
                                <li>Mapa de mesas pronto para QR Code</li>
                            </ul>
                            <div className={styles.cardFooter}>
                                <p className={styles.cardHighlight}>14 dias livres • ativa pagamento após o teste</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>O que vem pronto</p>
                        <h2>Do salão do restaurante à cozinha sem fricção</h2>
                        <p className={styles.sectionSubtitle}>
                            Cada área já tem o painel que precisa. É só cadastrar e usar.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        <article className={styles.feature}>
                            <span className={styles.badge}>Cliente</span>
                            <h3>Pedido pelo QR Code</h3>
                            <p>O cliente abre o cardápio, envia pedido e acompanha o status direto do celular.</p>
                            <Link to="/mesa/1" className={styles.inline}>Ver fluxo do cliente</Link>
                        </article>
                        <article className={styles.feature}>
                            <span className={styles.badgeAmber}>Cozinha</span>
                            <h3>KDS responsivo</h3>
                            <p>Pedidos sobem em tempo real com cores para pendente, preparando e atrasado.</p>
                            <Link to="/cozinha" className={styles.inline}>Abrir painel da cozinha</Link>
                        </article>
                        <article className={styles.feature}>
                            <span className={styles.badgeBlue}>Caixa</span>
                            <h3>Mapa de mesas e cardápio</h3>
                            <p>Configure mesas, QR Codes, categorias e preços sem depender de suporte.</p>
                            <Link to="/admin/registro" className={styles.inline}>Cadastrar restaurante</Link>
                        </article>
                    </div>
                </section>

            </main>

            <footer className={styles.rodape}>
                <div className="container">
                    <div className={styles.rodapeContent}>
                        <span className={styles.rodapeBrand}>Garçom Ágil</span>
                        <nav className={styles.rodapeLinks}>
                            <Link to="/privacidade">Política de Privacidade</Link>
                        </nav>
                    </div>
                </div>
            </footer>

            {modalLoginAberto && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <h3>Qual acesso você quer usar?</h3>
                            <button className={styles.modalClose} onClick={fecharLogin} aria-label="Fechar modal">×</button>
                        </div>
                        <p className={styles.modalTexto}>
                            Escolha se deseja entrar na visão de caixa (admin) ou no painel da cozinha.
                        </p>
                        <div className={styles.modalAcoes}>
                            <Botao variante="primario" onClick={() => irPara('/admin/login')}>Entrar como Caixa</Botao>
                            <Botao variante="secundario" onClick={() => irPara('/cozinha')}>Entrar na Cozinha</Botao>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

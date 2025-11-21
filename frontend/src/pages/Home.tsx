import { Link } from 'react-router-dom';
import { Botao } from '../components/Botao';
import styles from './Home.module.css';

export function Home() {
    return (
        <div className={styles.page}>
            <header className={styles.hero}>
                <div className="container">
                    <div className={styles.heroGrid}>
                        <div className={styles.copy}>
                            <p className={styles.kicker}>Garçom Ágil • SaaS de pedidos em tempo real</p>
                            <h1 className={styles.titulo}>Cadastre seu restaurante e rode 30 dias grátis no piloto automático</h1>
                            <p className={styles.subtitulo}>
                                Monte cardápio, mapa de mesas e KDS em minutos. Trial de 30 dias sem cartão;
                                depois disso, o checkout roda pelo Mercado Pago que você já usa.
                            </p>

                            <div className={styles.ctas}>
                                <Link to="/admin/registro">
                                    <Botao variante="primario" tamanho="grande">Começar teste de 30 dias</Botao>
                                </Link>
                                <Link to="/master/login">
                                    <Botao variante="secundario" tamanho="grande">Entrar no painel master</Botao>
                                </Link>
                            </div>
                            <p className={styles.trialMeta}>Sem cartão agora • Trial expira em 30 dias • Depois, cobrança via Mercado Pago</p>
                        </div>

                        <div className={styles.heroCard}>
                            <div className={styles.tag}>Trial + cobrança pronta</div>
                            <p className={styles.cardTitle}>Fluxo completo para restaurante, cozinha e assinaturas</p>
                            <ul className={styles.cardList}>
                                <li>Pedidos e status em tempo real</li>
                                <li>KDS responsivo com cores semáforo</li>
                                <li>Mapa de mesas pronto para QR Code</li>
                                <li>Painel master para ver trials e cobrar</li>
                            </ul>
                            <div className={styles.cardFooter}>
                                <p className={styles.cardHighlight}>30 dias livres • ativa pagamento após o trial</p>
                                <Link to="/admin/login" className={styles.linkInline}>Já tenho conta →</Link>
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
                            Cada área já tem o painel que precisa. É só cadastrar e ligar o trial.
                        </p>
                    </div>
                    <div className={styles.featureGrid}>
                        <article className={styles.feature}>
                            <span className={styles.badge}>Garçom</span>
                            <h3>Pedidos em 3 toques</h3>
                            <p>Busca por código, botoeiras grandes e feedback instantâneo para não travar o restaurante.</p>
                            <Link to="/mesa/1" className={styles.inline}>Ver fluxo de mesa</Link>
                        </article>
                        <article className={styles.feature}>
                            <span className={styles.badgeAmber}>Cozinha</span>
                            <h3>KDS responsivo</h3>
                            <p>Pedidos sobem em tempo real com cores para pendente, preparando e atrasado.</p>
                            <Link to="/cozinha" className={styles.inline}>Abrir painel da cozinha</Link>
                        </article>
                        <article className={styles.feature}>
                            <span className={styles.badgeBlue}>Admin</span>
                            <h3>Mapa de mesas e cardápio</h3>
                            <p>Configure mesas, QR Codes, categorias e preços sem depender de suporte.</p>
                            <Link to="/admin/registro" className={styles.inline}>Cadastrar restaurante</Link>
                        </article>
                    </div>
                </section>

                <section className={styles.sectionAlt}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Onboarding + cobrança</p>
                        <h2>Timeline do trial até o Mercado Pago</h2>
                        <p className={styles.sectionSubtitle}>
                            O sistema já guarda o fim do trial e deixa pronto para ativar a assinatura quando rodar o checkout.
                        </p>
                    </div>

                    <div className={styles.timeline}>
                        <div className={styles.step}>
                            <div className={styles.stepBadge}>1</div>
                            <div>
                                <p className={styles.stepTitle}>Cadastre em 2 minutos</p>
                                <p className={styles.stepText}>Cria admin e restaurante automaticamente. Trial começa na hora.</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepBadge}>2</div>
                            <div>
                                <p className={styles.stepTitle}>Configure cardápio e mesas</p>
                                <p className={styles.stepText}>Categorias, preços, QR Codes e mapa do restaurante já disponíveis.</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepBadge}>3</div>
                            <div>
                                <p className={styles.stepTitle}>Use 30 dias de teste</p>
                                <p className={styles.stepText}>O modelo guarda trialStart e trialEnd para cada restaurante.</p>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepBadge}>4</div>
                            <div>
                                <p className={styles.stepTitle}>Ative no Mercado Pago</p>
                                <p className={styles.stepText}>Depois do trial, finalize o checkout no Mercado Pago e o status muda para ativo.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.masterStrip}>
                    <div>
                        <p className={styles.kicker}>Painel master</p>
                        <h2>Seu login para acompanhar todos os trials e cobranças</h2>
                        <p className={styles.sectionSubtitle}>
                            Veja todos os restaurantes, status (trial, ativo, vencido ou bloqueado) e dados de cobrança.
                        </p>
                        <div className={styles.stripActions}>
                            <Link to="/master/login">
                                <Botao variante="primario" tamanho="grande">Acessar painel master</Botao>
                            </Link>
                            <Link to="/admin/login" className={styles.inline}>Entrar como restaurante</Link>
                        </div>
                    </div>
                    <div className={styles.stripCard}>
                        <p className={styles.cardTitle}>O que o master enxerga</p>
                        <ul className={styles.cardList}>
                            <li>Status de trial e dias restantes</li>
                            <li>Marcadores para cobrança no Mercado Pago</li>
                            <li>Contato do admin e plano atual</li>
                            <li>Botão para bloquear ou reativar</li>
                        </ul>
                    </div>
                </section>
            </main>
        </div>
    );
}

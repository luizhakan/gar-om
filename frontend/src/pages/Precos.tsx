import { Link, useNavigate } from 'react-router-dom';
import { Botao } from '../components/Botao';
import styles from './Precos.module.css';

const PLANOS = [
    {
        nome: 'Mensal',
        preco: 'R$ 100',
        periodo: '/mês',
        descricao: 'Flexível para começar sem compromisso anual.',
    },
    {
        nome: 'Trimestral',
        preco: 'R$ 270',
        periodo: '/trimestre',
        descricao: 'Equivale a R$ 90/mês — economize pagando a cada 3 meses.',
        destaque: true,
    },
    {
        nome: 'Anual',
        preco: 'R$ 960',
        periodo: '/ano',
        descricao: 'Equivale a R$ 80/mês — o melhor custo no plano padrão.',
    },
];

const INCLUSO = [
    'Cardápio digital com QR Code por mesa',
    'Comanda compartilhada entre vários celulares',
    'Painel da cozinha (KDS) em tempo real',
    'Mapa de mesas e troca de mesa sincronizada',
    'Gestão completa de produtos e categorias',
    'Pagamentos via Pix, boleto e cartão (Mercado Pago)',
];

export function Precos() {
    const navigate = useNavigate();
    const irParaRegistro = () => navigate('/admin/registro');

    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <div className="container">
                    <div className={styles.topbarContent}>
                        <Link to="/" className={styles.brand}>Garçom Ágil</Link>
                        <nav className={styles.nav}>
                            <Link to="/como-funciona" className={styles.navLink}>Como funciona</Link>
                            <Link to="/" className={styles.voltar}>← Início</Link>
                        </nav>
                    </div>
                </div>
            </div>

            <header className={styles.hero}>
                <div className="container">
                    <p className={styles.kicker}>Planos e preços</p>
                    <h1 className={styles.titulo}>Preço simples, sem surpresa</h1>
                    <p className={styles.subtitulo}>
                        Comece com 14 dias grátis, sem cartão. Depois do teste, escolha o plano que
                        combina com o seu restaurante. Pagamento único via Mercado Pago, sem fidelidade.
                    </p>
                </div>
            </header>

            <main className="container">
                {/* ── Plano Fundador em destaque ── */}
                <section className={styles.fundador}>
                    <div className={styles.fundadorSelo}>⚡ Oferta de lançamento — só 10 vagas</div>
                    <div className={styles.fundadorGrid}>
                        <div>
                            <h2 className={styles.fundadorTitulo}>Plano Fundador</h2>
                            <p className={styles.fundadorTexto}>
                                Seja um dos <strong>10 primeiros restaurantes</strong> e garanta o primeiro ano
                                com mais de 45% de desconto. A vaga é exclusiva durante o seu teste de 14 dias.
                            </p>
                            <ul className={styles.fundadorLista}>
                                <li>Tudo que o Plano Anual oferece</li>
                                <li>Preço travado no primeiro ano</li>
                                <li>Apoio direto de quem está construindo o produto</li>
                            </ul>
                        </div>
                        <div className={styles.fundadorCard}>
                            <span className={styles.precoOriginal}>R$ 960,00/ano</span>
                            <div className={styles.precoFundador}>
                                R$ 500 <span>/ano</span>
                            </div>
                            <span className={styles.economia}>Economia de R$ 460 no 1º ano</span>
                            <Botao variante="primario" tamanho="grande" onClick={irParaRegistro}>
                                Garantir minha vaga
                            </Botao>
                            <p className={styles.fundadorNota}>
                                * Após o 1º ano, renova pelo Plano Anual (R$ 960). Oferta liberada na tela de
                                assinatura durante o teste, enquanto houver vagas.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Planos padrão ── */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Planos padrão</p>
                        <h2>Escolha como prefere pagar</h2>
                    </div>
                    <div className={styles.planoGrid}>
                        {PLANOS.map((plano) => (
                            <article
                                key={plano.nome}
                                className={`${styles.plano} ${plano.destaque ? styles.planoDestaque : ''}`}
                            >
                                {plano.destaque && <span className={styles.tagPopular}>Mais popular</span>}
                                <p className={styles.planoNome}>{plano.nome}</p>
                                <p className={styles.planoPreco}>
                                    {plano.preco}
                                    <span className={styles.planoPeriodo}>{plano.periodo}</span>
                                </p>
                                <p className={styles.planoDescricao}>{plano.descricao}</p>
                                <Botao
                                    variante={plano.destaque ? 'primario' : 'secundario'}
                                    onClick={irParaRegistro}
                                >
                                    Começar teste grátis
                                </Botao>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── O que está incluso ── */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Incluído em todos os planos</p>
                        <h2>Tudo o que você precisa, sem módulos pagos à parte</h2>
                    </div>
                    <ul className={styles.inclusoLista}>
                        {INCLUSO.map((item) => (
                            <li key={item} className={styles.inclusoItem}>
                                <span className={styles.check}>✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className={styles.cta}>
                    <h2>Teste sem compromisso por 14 dias</h2>
                    <p>Sem cartão agora. Você só escolhe um plano quando o teste terminar.</p>
                    <div className={styles.ctaAcoes}>
                        <Botao variante="primario" tamanho="grande" onClick={irParaRegistro}>
                            Criar conta grátis
                        </Botao>
                        <Botao variante="secundario" tamanho="grande" onClick={() => navigate('/como-funciona')}>
                            Ver como funciona
                        </Botao>
                    </div>
                </section>
            </main>

            <footer className={styles.rodape}>
                <div className="container">
                    <div className={styles.rodapeContent}>
                        <span className={styles.rodapeBrand}>Garçom Ágil</span>
                        <nav className={styles.rodapeLinks}>
                            <Link to="/como-funciona">Como funciona</Link>
                            <Link to="/privacidade">Política de Privacidade</Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}

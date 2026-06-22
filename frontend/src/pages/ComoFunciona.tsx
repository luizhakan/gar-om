import { Link, useNavigate } from 'react-router-dom';
import { Botao } from '../components/Botao';
import styles from './ComoFunciona.module.css';

const PASSOS = [
    {
        numero: '1',
        titulo: 'Cadastre o restaurante',
        texto: 'Crie sua conta em minutos e comece o teste de 14 dias grátis, sem precisar de cartão.',
    },
    {
        numero: '2',
        titulo: 'Monte cardápio e mesas',
        texto: 'Cadastre categorias, produtos com foto e preço, e gere o QR Code de cada mesa.',
    },
    {
        numero: '3',
        titulo: 'O cliente pede pelo celular',
        texto: 'Ele escaneia o QR Code, abre a comanda com um código seguro e envia o pedido sem instalar app.',
    },
    {
        numero: '4',
        titulo: 'A cozinha recebe na hora',
        texto: 'O pedido sobe no painel da cozinha em tempo real, com cores para pendente, preparando e pronto.',
    },
    {
        numero: '5',
        titulo: 'Acompanhe e feche a conta',
        texto: 'O cliente vê o status do preparo e solicita o fechamento. O caixa controla tudo em tempo real.',
    },
];

const ATORES = [
    {
        badge: styles.badge,
        rotulo: 'Cliente',
        titulo: 'Pedido pelo QR Code',
        texto: 'Cardápio digital responsivo, comanda compartilhada entre vários celulares da mesma mesa e acompanhamento do preparo em tempo real.',
    },
    {
        badge: styles.badgeAmber,
        rotulo: 'Cozinha',
        titulo: 'KDS em tempo real',
        texto: 'Painel limpo que recebe os pedidos instantaneamente e atualiza o status de pendente para preparando e pronto.',
    },
    {
        badge: styles.badgeBlue,
        rotulo: 'Caixa',
        titulo: 'Gestão do salão',
        texto: 'Mapa de mesas, troca de mesa com sincronização, controle de comandas e gestão completa do cardápio.',
    },
];

export function ComoFunciona() {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <div className="container">
                    <div className={styles.topbarContent}>
                        <Link to="/" className={styles.brand}>Garçom Ágil</Link>
                        <nav className={styles.nav}>
                            <Link to="/precos" className={styles.navLink}>Preços</Link>
                            <Link to="/" className={styles.voltar}>← Início</Link>
                        </nav>
                    </div>
                </div>
            </div>

            <header className={styles.hero}>
                <div className="container">
                    <p className={styles.kicker}>Como funciona</p>
                    <h1 className={styles.titulo}>Do salão à cozinha, sem fricção</h1>
                    <p className={styles.subtitulo}>
                        O Garçom Ágil conecta cliente, cozinha e caixa em tempo real. O cliente pede pelo
                        próprio celular, a cozinha recebe na hora e você acompanha tudo de um só lugar.
                    </p>
                    <div className={styles.ctas}>
                        <Botao variante="primario" tamanho="grande" onClick={() => navigate('/admin/registro')}>
                            Começar teste de 14 dias
                        </Botao>
                        <Botao variante="secundario" tamanho="grande" onClick={() => navigate('/precos')}>
                            Ver preços
                        </Botao>
                    </div>
                </div>
            </header>

            <main className="container">
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Passo a passo</p>
                        <h2>5 passos para começar a vender</h2>
                    </div>
                    <ol className={styles.passos}>
                        {PASSOS.map((passo) => (
                            <li key={passo.numero} className={styles.passo}>
                                <span className={styles.passoNumero}>{passo.numero}</span>
                                <div>
                                    <h3 className={styles.passoTitulo}>{passo.titulo}</h3>
                                    <p className={styles.passoTexto}>{passo.texto}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Um painel para cada área</p>
                        <h2>Cada parte da operação tem o que precisa</h2>
                    </div>
                    <div className={styles.atorGrid}>
                        {ATORES.map((ator) => (
                            <article key={ator.rotulo} className={styles.ator}>
                                <span className={ator.badge}>{ator.rotulo}</span>
                                <h3>{ator.titulo}</h3>
                                <p>{ator.texto}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={styles.cta}>
                    <h2>Pronto para testar no seu restaurante?</h2>
                    <p>14 dias grátis, sem cartão. Cancele quando quiser.</p>
                    <div className={styles.ctas}>
                        <Botao variante="primario" tamanho="grande" onClick={() => navigate('/admin/registro')}>
                            Criar conta grátis
                        </Botao>
                        <Botao variante="secundario" tamanho="grande" onClick={() => navigate('/precos')}>
                            Ver planos e preços
                        </Botao>
                    </div>
                </section>
            </main>

            <footer className={styles.rodape}>
                <div className="container">
                    <div className={styles.rodapeContent}>
                        <span className={styles.rodapeBrand}>Garçom Ágil</span>
                        <nav className={styles.rodapeLinks}>
                            <Link to="/precos">Preços</Link>
                            <Link to="/privacidade">Política de Privacidade</Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}

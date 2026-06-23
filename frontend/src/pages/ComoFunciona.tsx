import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    useEffect(() => {
        document.title = "Como Funciona a Comanda Digital e Cardápio QR Code | Garçom Ágil";
    }, []);

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
                    <h1 className={styles.titulo}>Como funciona o Garçom Ágil: comanda digital e cardápio QR Code</h1>
                    <p className={styles.subtitulo}>
                        O Garçom Ágil conecta cliente, cozinha e caixa em tempo real. O cliente pede pelo
                        próprio celular, a cozinha recebe na hora e você acompanha tudo de um só lugar.
                    </p>
                    <div className={styles.ctas}>
                        <Link to="/admin/registro" className={styles.ctaLink}>
                            <Botao variante="primario" tamanho="grande">
                                Começar teste de 14 dias
                            </Botao>
                        </Link>
                        <Link to="/precos" className={styles.ctaLink}>
                            <Botao variante="secundario" tamanho="grande">
                                Ver preços
                            </Botao>
                        </Link>
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

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <p className={styles.kicker}>Segurança e Controle</p>
                        <h2>Sua operação protegida contra fraudes</h2>
                    </div>
                    <div className={styles.segurancaGrid}>
                        <div className={styles.segurancaCard}>
                            <h3>🔒 Aprovação de Dispositivos</h3>
                            <p>Evite pedidos indesejados. Quando um cliente lê o QR Code da mesa, ele precisa de aprovação para começar a pedir.</p>
                        </div>
                        <div className={styles.segurancaCard}>
                            <h3>👑 Controle do Cliente Master</h3>
                            <p>A primeira pessoa que abre a mesa torna-se o "Master", com autonomia para gerenciar e aprovar os dispositivos de quem se senta com ela.</p>
                        </div>
                        <div className={styles.segurancaCard}>
                            <h3>🛡️ Poder do Estabelecimento</h3>
                            <p>A equipe do restaurante (caixa e gerência) tem total controle, podendo remover acessos e gerenciar os participantes de cada comanda pelo painel.</p>
                        </div>
                    </div>
                </section>

                <section className={styles.cta}>
                    <h2>Pronto para testar no seu restaurante?</h2>
                    <p>14 dias grátis, sem cartão. Cancele quando quiser.</p>
                    <div className={styles.ctas}>
                        <Link to="/admin/registro" className={styles.ctaLink}>
                            <Botao variante="primario" tamanho="grande">
                                Criar conta grátis
                            </Botao>
                        </Link>
                        <Link to="/precos" className={styles.ctaLink}>
                            <Botao variante="secundario" tamanho="grande">
                                Ver planos e preços
                            </Botao>
                        </Link>
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

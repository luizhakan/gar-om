import { Link } from 'react-router-dom';
import styles from './Privacidade.module.css';

// Data da última revisão deste documento. Atualize ao alterar o conteúdo.
const ULTIMA_ATUALIZACAO = '19 de junho de 2026';
const EMAIL_CONTATO = 'luizhakan2@protonmail.com';

export function Privacidade() {
    return (
        <div className={styles.page}>
            <div className={styles.topbar}>
                <div className="container">
                    <div className={styles.topbarContent}>
                        <Link to="/" className={styles.brand}>Garçom Ágil</Link>
                        <Link to="/" className={styles.voltar}>← Voltar ao início</Link>
                    </div>
                </div>
            </div>

            <main className="container">
                <article className={styles.documento}>
                    <header className={styles.cabecalho}>
                        <p className={styles.kicker}>Política de Privacidade</p>
                        <h1 className={styles.titulo}>Como tratamos seus dados</h1>
                        <p className={styles.atualizacao}>Última atualização: {ULTIMA_ATUALIZACAO}</p>
                    </header>

                    <p className={styles.intro}>
                        Esta Política explica de forma clara quais dados pessoais o Garçom Ágil coleta,
                        por que coleta, com quem compartilha e quais são os seus direitos, em conformidade
                        com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
                    </p>

                    <section className={styles.secao}>
                        <h2>1. Quem é o responsável pelos dados</h2>
                        <p>
                            O Garçom Ágil é uma plataforma de gestão de pedidos para restaurantes. Para fins
                            da LGPD, atuamos como <strong>controladores</strong> dos dados de cadastro dos
                            restaurantes assinantes e como <strong>operadores</strong> dos dados que cada
                            restaurante coleta de seus próprios clientes ao usar a plataforma.
                        </p>
                        <p>
                            Controlador responsável: <strong>CNPJ 47.988.221/0001-83</strong>.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>2. Quais dados coletamos</h2>

                        <h3>2.1. Dados do restaurante (administrador)</h3>
                        <ul>
                            <li>Nome do responsável e nome do estabelecimento;</li>
                            <li>E-mail e telefone de contato/cobrança;</li>
                            <li>CPF, quando necessário para emissão de cobrança e identificação fiscal;</li>
                            <li>Senha de acesso, armazenada de forma criptografada (hash) — nunca em texto puro.</li>
                        </ul>

                        <h3>2.2. Dados dos clientes do restaurante (consumidor na mesa)</h3>
                        <ul>
                            <li>
                                Um <strong>apelido opcional</strong>, informado pelo próprio cliente ao entrar
                                em uma comanda. Não exigimos nome completo, e-mail ou documento do consumidor
                                para fazer pedidos.
                            </li>
                            <li>Itens e observações dos pedidos realizados na mesa.</li>
                        </ul>

                        <h3>2.3. Dados de pagamento</h3>
                        <p>
                            Os pagamentos de assinatura são processados pelo <strong>Mercado Pago</strong>.
                            Os dados de cartão são tratados diretamente por eles — nós não armazenamos
                            números de cartão. Guardamos apenas informações necessárias para conciliar a
                            cobrança, como o e-mail e o documento (CPF/CNPJ) do pagador e o status do pagamento.
                        </p>

                        <h3>2.4. Dados técnicos no seu dispositivo</h3>
                        <p>
                            O Garçom Ágil <strong>não utiliza cookies de rastreamento</strong> nem
                            ferramentas de analytics ou publicidade de terceiros. Usamos apenas o
                            armazenamento local do navegador (<code>localStorage</code>) para manter sua
                            sessão ativa, lembrar o carrinho e os pedidos em andamento. Esses dados ficam no
                            seu próprio dispositivo e são essenciais para o funcionamento do serviço.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>3. Por que tratamos esses dados (bases legais)</h2>
                        <ul>
                            <li>
                                <strong>Execução de contrato</strong> (Art. 7º, V): criar e manter sua conta,
                                processar pedidos e fornecer a plataforma contratada.
                            </li>
                            <li>
                                <strong>Cumprimento de obrigação legal</strong> (Art. 7º, II): registros
                                fiscais e financeiros relacionados às cobranças.
                            </li>
                            <li>
                                <strong>Legítimo interesse</strong> (Art. 7º, IX): segurança da conta,
                                prevenção a fraudes e melhoria do serviço, sempre respeitando seus direitos.
                            </li>
                        </ul>
                    </section>

                    <section className={styles.secao}>
                        <h2>4. Com quem compartilhamos</h2>
                        <p>Compartilhamos dados apenas com parceiros essenciais à operação:</p>
                        <ul>
                            <li><strong>Mercado Pago</strong> — processamento de pagamentos de assinatura;</li>
                            <li>
                                <strong>Provedor de infraestrutura/hospedagem</strong> — armazenamento seguro
                                dos dados da aplicação.
                            </li>
                        </ul>
                        <p>
                            Não vendemos seus dados pessoais e não os compartilhamos para fins de publicidade.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>5. Por quanto tempo guardamos</h2>
                        <p>
                            Mantemos os dados pelo tempo necessário para prestar o serviço e cumprir
                            obrigações legais. Encerrada a conta, os dados de cadastro são eliminados ou
                            anonimizados, salvo registros que a lei exija preservar (por exemplo, fiscais).
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>6. Seus direitos como titular</h2>
                        <p>A LGPD garante a você, entre outros, o direito de:</p>
                        <ul>
                            <li>Confirmar a existência de tratamento e acessar seus dados;</li>
                            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                            <li>Solicitar a portabilidade dos dados;</li>
                            <li>Revogar consentimento e ser informado sobre o compartilhamento.</li>
                        </ul>
                        <p>
                            Para exercer qualquer um desses direitos, escreva para{' '}
                            <a href={`mailto:${EMAIL_CONTATO}`} className={styles.link}>{EMAIL_CONTATO}</a>.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>7. Segurança</h2>
                        <p>
                            Adotamos medidas técnicas e organizacionais para proteger seus dados, como
                            criptografia de senhas, conexões protegidas por HTTPS e controle de acesso por
                            função. Nenhum sistema é totalmente imune a incidentes, mas trabalhamos
                            continuamente para reduzir riscos.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>8. Encarregado e contato</h2>
                        <p>
                            Dúvidas sobre esta Política ou sobre o tratamento dos seus dados podem ser
                            enviadas ao nosso Encarregado de Proteção de Dados (DPO) pelo e-mail{' '}
                            <a href={`mailto:${EMAIL_CONTATO}`} className={styles.link}>{EMAIL_CONTATO}</a>.
                        </p>
                    </section>

                    <section className={styles.secao}>
                        <h2>9. Alterações nesta Política</h2>
                        <p>
                            Podemos atualizar esta Política periodicamente. Quando isso ocorrer, revisamos a
                            data de “última atualização” no topo. Mudanças relevantes serão comunicadas pelos
                            canais da plataforma.
                        </p>
                    </section>

                    <footer className={styles.rodapeDoc}>
                        <Link to="/" className={styles.link}>← Voltar ao início</Link>
                    </footer>
                </article>
            </main>
        </div>
    );
}

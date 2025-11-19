import { Link } from 'react-router-dom';
import { CardProduto } from '../components/CardProduto';
import { Botao } from '../components/Botao';
import { produtosMock } from '../mocks/cardapio';

export function Home() {
    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: 'var(--tamanho-titulo-xl)', marginBottom: '0.5rem' }}>
                    🍽️ Garçom Ágil
                </h1>
                <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 'var(--tamanho-titulo-sm)' }}>
                    Sistema de Pedidos sem Fricção
                </p>
            </header>

            <nav style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginBottom: '3rem',
                flexWrap: 'wrap'
            }}>
                <Link to="/admin">
                    <Botao variante="primario">🔐 Painel Admin</Botao>
                </Link>
                <Link to="/cozinha">
                    <Botao variante="secundario">👨‍🍳 Cozinha</Botao>
                </Link>
                <Link to="/mesa/1">
                    <Botao variante="secundario">📱 Cliente (Mesa 1)</Botao>
                </Link>
            </nav>

            <section>
                <h2 style={{ marginBottom: '1rem' }}>Preview de Componentes</h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem'
                }}>
                    {produtosMock.slice(0, 6).map(produto => (
                        <CardProduto
                            key={produto.id}
                            produto={produto}
                            exibirBotaoAdicionar
                            aoClicar={(p) => console.log('Clicou em:', p.nome)}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

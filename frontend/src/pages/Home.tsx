import { Link } from 'react-router-dom';
import { Botao } from '../components/Botao';

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
            </nav>

        </div>
    );
}

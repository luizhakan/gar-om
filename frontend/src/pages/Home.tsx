import { Link } from 'react-router-dom';
import { obterRestauranteId } from '../utils/sessao';
import { Botao } from '../components/Botao';

export function Home() {
    const restauranteId = obterRestauranteId();
    const rotaMesaDemo = (restauranteId ?? '') !== '' ? `/mesa/1?restauranteId=${restauranteId ?? ''}` : '/mesa/1';

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
                <Link to={rotaMesaDemo}>
                    <Botao variante="secundario">📱 Cliente (Mesa 1)</Botao>
                </Link>
            </nav>

        </div>
    );
}

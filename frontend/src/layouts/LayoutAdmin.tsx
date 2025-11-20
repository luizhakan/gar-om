import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProvedorAdmin, useAdmin } from '../contexts/ContextoAdmin';
import styles from './layoutAdmin.module.css';

function ConteudoLayoutAdmin() {
    const location = useLocation();
    const { autenticado, logout } = useAdmin();
    const estaNaRotaLogin = location.pathname === '/admin/login';
    const estaNaRotaRegistro = location.pathname === '/admin/registro';
    const rotaPublica = estaNaRotaLogin || estaNaRotaRegistro;

    if (!autenticado && !rotaPublica) {
        return <Navigate to="/admin/login" replace />;
    }

    // NavLink precisa de função para className com ,?
    const linkAtivo = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${styles.link} ${styles.linkAtivo}` : styles.link;

    return (
        <div className={styles.shell}>
            {!rotaPublica && (
                <aside className={styles.sidebar}>
                    <div className={styles.logo}>
                        <span role="img" aria-label="garçom">🧾</span>
                        <div>
                            <p className={styles.logoNome}>Garçom Ágil</p>
                            <p className={styles.logoSub}>Painel Admin</p>
                        </div>
                    </div>

                    <nav className={styles.nav}>
                        <NavLink to="/admin" end className={linkAtivo}>
                            📊 Visão Geral
                        </NavLink>
                        <NavLink to="/admin/produtos" className={linkAtivo}>
                            🍔 Produtos
                        </NavLink>
                        <NavLink to="/admin/mesas" className={linkAtivo}>
                            🪑 Mesas & QR Code
                        </NavLink>
                    </nav>

                    <button className={styles.botaoSair} onClick={logout}>
                        Sair
                    </button>
                </aside>
            )}

            <main className={styles.main}>
                <div className={styles.container}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export function LayoutAdmin() {
    return (
        <ProvedorAdmin>
            <ConteudoLayoutAdmin />
        </ProvedorAdmin>
    );
}

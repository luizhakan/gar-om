import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ProvedorAdmin } from '../contexts/ContextoAdmin';
import { useAdmin } from '../hooks/useAdmin';
import { BloqueioAssinatura } from '../components/BloqueioAssinatura';
import styles from './layoutAdmin.module.css';
import { useEffect, useState } from 'react';

function ConteudoLayoutAdmin() {
    const location = useLocation();
    const { autenticado, logout, assinaturaBloqueada } = useAdmin();
    const estaNaRotaLogin = location.pathname === '/admin/login';
    const estaNaRotaRegistro = location.pathname === '/admin/registro';
    const estaNaRotaAssinatura = location.pathname === '/admin/assinatura';
    const rotaPublica = estaNaRotaLogin || estaNaRotaRegistro;
    const [menuAberto, setMenuAberto] = useState(false);

    useEffect(() => {
        setMenuAberto(false);
    }, [location.pathname]);

    if (!autenticado && !rotaPublica) {
        return <Navigate to="/admin/login" replace />;
    }

    // Bloqueia acesso se assinatura atrasada (exceto rota de assinatura)
    const deveBloquear = assinaturaBloqueada && !estaNaRotaAssinatura && !rotaPublica;

    // NavLink precisa de função para className com ,?
    const linkAtivo = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${styles.link} ${styles.linkAtivo}` : styles.link;

    return (
        <div className={`${styles.shell} ${rotaPublica ? styles.shellPublic : ''}`}>
            {deveBloquear && <BloqueioAssinatura />}
            
            {!rotaPublica && (
                <>
                    <header className={styles.topbar}>
                        <div className={styles.logo}>
                            <span role="img" aria-label="garçom">🧾</span>
                            <div>
                                <p className={styles.logoNome}>Garçom Ágil</p>
                                <p className={styles.logoSub}>Caixa</p>
                            </div>
                        </div>
                        <div className={styles.topbarAcoes}>
                            <button
                                className={styles.toggle}
                                onClick={() => { setMenuAberto(v => !v); }}
                                aria-label="Alternar menu"
                            >
                                ☰
                            </button>
                            <button className={styles.botaoSair} onClick={logout}>
                                Sair
                            </button>
                        </div>
                    </header>

                    <aside className={`${styles.sidebar} ${menuAberto ? styles.sidebarAberta : ''}`}>
                        <div className={styles.sidebarConteudo}>
                            <nav className={styles.nav}>
                                <NavLink to="/admin" end className={linkAtivo}>
                                    📊 Visão Geral
                                </NavLink>
                                <NavLink to="/admin/categorias" className={linkAtivo}>
                                    🗂️ Categorias
                                </NavLink>
                                <NavLink to="/admin/produtos" className={linkAtivo}>
                                    🍔 Produtos
                                </NavLink>
                                <NavLink to="/admin/mesas" className={linkAtivo}>
                                    🪑 Mesas & QR Code
                                </NavLink>
                                <NavLink to="/admin/cozinha" className={linkAtivo}>
                                    🍳 Usuário da Cozinha
                                </NavLink>
                                <NavLink to="/admin/assinatura" className={linkAtivo}>
                                    💳 Assinatura
                                </NavLink>
                            </nav>

                            <div className={styles.sidebarRodape}>
                                <button className={`${styles.botaoSair} ${styles.botaoSairSidebar}`} onClick={logout}>
                                    Sair
                                </button>
                            </div>
                        </div>
                    </aside>
                </>
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

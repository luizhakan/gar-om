import { useNavigate, useRouteError } from 'react-router-dom';
import styles from './ErroAplicacao.module.css';

export function PaginaErro() {
    const erro = useRouteError() as Error | null;
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>Algo saiu do script</p>
                <h1 className={styles.titulo}>Erro inesperado</h1>
                <p className={styles.subtitulo}>
                    {erro?.message ?? 'Ocorreu um erro interno. Tente novamente ou volte para o início.'}
                </p>
                <div className={styles.acoes}>
                    <button className={styles.botaoPrimario} onClick={() => { void navigate(0); }}>Tentar novamente</button>
                    <button className={styles.botaoSecundario} onClick={() => { void navigate('/'); }}>Ir para a Home</button>
                </div>
            </div>
        </div>
    );
}

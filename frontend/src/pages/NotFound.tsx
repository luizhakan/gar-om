import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

export function Pagina404() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>404</p>
                <h1 className={styles.titulo}>Ops, não encontrei essa rota</h1>
                <p className={styles.subtitulo}>O endereço digitado não existe. Volte para o início ou escolha um módulo.</p>
                <div className={styles.acoes}>
                    <button className={styles.botaoPrimario} onClick={() => { void navigate('/'); }}>Página inicial</button>
                    <button className={styles.botaoSecundario} onClick={() => { void navigate(-1); }}>Voltar</button>
                </div>
            </div>
        </div>
    );
}

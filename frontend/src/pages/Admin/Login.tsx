import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/ContextoAdmin';
import { Botao } from '../../components/Botao';
import styles from './Login.module.css';

export function LoginAdmin() {
    const { autenticado, login } = useAdmin();
    const navigate = useNavigate();
    const [senha, setSenha] = useState('');

    useEffect(() => {
        if (autenticado) {
            navigate('/admin', { replace: true });
        }
    }, [autenticado, navigate]);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        login(senha);
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>Acesso restrito</p>
                <h1 className={styles.titulo}>Painel do Dono</h1>
                <p className={styles.subtitulo}>Use a senha combinada com a equipe para entrar.</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label} htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        className={styles.input}
                        placeholder="Digite a senha"
                    />

                    <Botao type="submit" variante="primario" tamanho="grande" className={styles.botao}>
                        Entrar
                    </Botao>
                </form>
            </div>
        </div>
    );
}

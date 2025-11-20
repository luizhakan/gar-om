import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/ContextoAdmin';
import { Botao } from '../../components/Botao';
import styles from './Login.module.css';

export function LoginAdmin() {
    const { autenticado, login } = useAdmin();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (autenticado) {
            navigate('/admin', { replace: true });
        }
    }, [autenticado, navigate]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        try {
            setErro('');
            await login(email, senha);
        } catch (e) {
            setErro('Falha no login. Verifique email/senha.');
            console.error(e);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>Acesso restrito</p>
                <h1 className={styles.titulo}>Painel do Dono</h1>
                <p className={styles.subtitulo}>Entre com seu email e senha cadastrados.</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={styles.input}
                        placeholder="seuemail@restaurante.com"
                        required
                    />

                    <label className={styles.label} htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(event) => setSenha(event.target.value)}
                        className={styles.input}
                        placeholder="Digite a senha"
                        required
                    />

                    {erro && <p className={styles.erro}>{erro}</p>}

                    <Botao type="submit" variante="primario" tamanho="grande" className={styles.botao}>
                        Entrar
                    </Botao>
                </form>
            </div>
        </div>
    );
}

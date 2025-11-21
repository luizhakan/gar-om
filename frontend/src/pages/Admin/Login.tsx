import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
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
            void navigate('/admin', { replace: true });
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
            <div className={styles.modalOverlay}>
                <div className={styles.modalConteudo}>
                    <div className={styles.modalIcone}>🧾</div>
                    <h2 className={styles.modalTitulo}>Login do Caixa</h2>
                    <p className={styles.modalTexto}>
                        Entre com o email e senha cadastrados para gerenciar cardápio, mesas e pedidos.
                    </p>

                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                    >
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => { setEmail(event.target.value); }}
                            className={styles.inputLogin}
                            placeholder="caixa@restaurante.com"
                            required
                        />

                        <input
                            id="senha"
                            type="password"
                            value={senha}
                            onChange={(event) => { setSenha(event.target.value); }}
                            className={styles.inputLogin}
                            placeholder="senha"
                            required
                        />

                        {erro && <p className={styles.erroLogin}>{erro}</p>}

                        <Botao type="submit" variante="primario" tamanho="grande">
                            Entrar como Caixa
                        </Botao>
                    </form>
                </div>
            </div>
        </div>
    );
}

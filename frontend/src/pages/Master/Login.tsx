import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao } from '../../components/Botao';
import { ServicoAuth } from '../../services/ServicoAuth';
import { definirSessao, obterTipoSessao } from '../../utils/sessao';
import styles from './MasterLogin.module.css';

export function MasterLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('founder@garcom.com');
    const [senha, setSenha] = useState('senha123');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        if (obterTipoSessao() === 'master') {
            void navigate('/master', { replace: true });
        }
    }, [navigate]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setCarregando(true);
        setErro('');
        try {
            const resp = await ServicoAuth.loginMaster(email, senha);
            definirSessao('master', 'master', resp.token, resp.master.email, resp.refreshToken);
            void navigate('/master', { replace: true });
        } catch (e) {
            console.error('[MasterLogin] Erro ao autenticar', e);
            setErro('Não foi possível entrar. Verifique as credenciais.');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>Painel master</p>
                <h1 className={styles.titulo}>Entrar para gerenciar trials</h1>
                <p className={styles.subtitulo}>Use o login criado para o dono da plataforma.</p>

                <form className={styles.form} onSubmit={(e) => { void handleSubmit(e); }}>
                    <label className={styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => { setEmail(event.target.value); }}
                        className={styles.input}
                        placeholder="seuemail@plataforma.com"
                        required
                    />

                    <label className={styles.label} htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(event) => { setSenha(event.target.value); }}
                        className={styles.input}
                        placeholder="Digite a senha"
                        required
                    />

                    {erro && <p className={styles.erro}>{erro}</p>}

                    <Botao type="submit" variante="primario" tamanho="grande" className={styles.botao} disabled={carregando}>
                        {carregando ? 'Entrando...' : 'Acessar painel master'}
                    </Botao>
                </form>
            </div>
        </div>
    );
}

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Botao } from '../../components/Botao';
import { ServicoAuth } from '../../services/ServicoAuth';
import { useToast } from '../../contexts/ContextoToast';
import { definirSessao } from '../../utils/sessao';
import styles from './Login.module.css';

export function RegistrarAdmin() {
    const navigate = useNavigate();
    const { notificar } = useToast();
    const [nome, setNome] = useState('');
    const [nomeRestaurante, setNomeRestaurante] = useState('');
    const [email, setEmail] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setCarregando(true);
        try {
            const resp = await ServicoAuth.registrarAdmin(nome, nomeRestaurante, email, cpfCnpj, senha);
            definirSessao(
                resp.admin.restauranteId,
                'admin',
                resp.token,
                resp.admin.email,
                resp.refreshToken,
            );
            notificar('Cadastro concluído! Você já pode acessar o painel.', 'sucesso');
            void navigate('/admin/login', { replace: true });
        } catch (erro) {
            console.error('[RegistrarAdmin] Erro ao criar conta', erro);
            notificar('Não foi possível registrar. Verifique os dados.', 'erro');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <p className={styles.rotulo}>Novo restaurante</p>
                <h1 className={styles.titulo}>Criar conta</h1>
                <p className={styles.subtitulo}>Um cadastro cria também o restaurante vinculado.</p>

                <form
                    className={styles.form}
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <label className={styles.label} htmlFor="nome">Nome completo</label>
                    <input
                        id="nome"
                        type="text"
                        value={nome}
                        onChange={(event) => { setNome(event.target.value); }}
                        className={styles.input}
                        placeholder="Maria Souza"
                        required
                    />

                    <label className={styles.label} htmlFor="nomeRestaurante">Nome do Restaurante</label>
                    <input
                        id="nomeRestaurante"
                        type="text"
                        value={nomeRestaurante}
                        onChange={(event) => { setNomeRestaurante(event.target.value); }}
                        className={styles.input}
                        placeholder="Restaurante Sabor da Casa"
                        required
                    />

                    <label className={styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => { setEmail(event.target.value); }}
                        className={styles.input}
                        placeholder="seuemail@restaurante.com"
                        required
                    />

                    <label className={styles.label} htmlFor="cpf">CPF ou CNPJ</label>
                    <input
                        id="cpf"
                        type="text"
                        value={cpfCnpj}
                        onChange={(event) => { setCpfCnpj(event.target.value); }}
                        className={styles.input}
                        placeholder="000.000.000-00 ou 00.000.000/0001-00"
                        required
                    />

                    <label className={styles.label} htmlFor="senha">Senha</label>
                    <input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(event) => { setSenha(event.target.value); }}
                        className={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
                    />

                    <Botao type="submit" variante="primario" tamanho="grande" className={styles.botao} disabled={carregando}>
                        {carregando ? 'Criando conta...' : 'Cadastrar'}
                    </Botao>
                    <button type="button" className={styles.linkAlternativo} onClick={() => { void navigate('/admin/login'); }}>
                        Já tenho conta
                    </button>
                </form>
            </div>
        </div>
    );
}

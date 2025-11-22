import { useState, type FormEvent } from 'react';
import { Botao } from '../../components/Botao';
import { useAdmin } from '../../hooks/useAdmin';
import type { UsuarioCozinha } from '../../types/UsuarioCozinha';
import styles from './Cozinha.module.css';

type Mensagem = { tipo: 'sucesso' | 'erro'; texto: string };
const SENHA_PADRAO_COZINHA = 'cozinha123';

function formatarDataCurta(dataIso?: string) {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleString();
}

export function CozinhaAdmin() {
    const {
        usuarioCozinha,
        criarUsuarioCozinha,
        carregandoUsuarioCozinha,
        alterarSenhaUsuarioCozinha,
    } = useAdmin();

    const [mensagem, setMensagem] = useState<Mensagem | null>(null);
    const [submetendoCriacao, setSubmetendoCriacao] = useState(false);
    const [novaSenha, setNovaSenha] = useState('');
    const [submetendoSenha, setSubmetendoSenha] = useState(false);

    const carregando = carregandoUsuarioCozinha || usuarioCozinha === undefined;
    const jaExisteUsuario = Boolean(usuarioCozinha);
    const usuarioAtual: UsuarioCozinha | null = usuarioCozinha ?? null;

    async function handleCriar(event: FormEvent) {
        event.preventDefault();
        if (jaExisteUsuario) return;

        setMensagem(null);
        setSubmetendoCriacao(true);
        try {
            const criado = await criarUsuarioCozinha();
            setMensagem({
                tipo: 'sucesso',
                texto: `Login ${criado.login} criado. Senha padrão: ${SENHA_PADRAO_COZINHA}.`,
            });
        } catch (erro) {
            console.error('[CozinhaAdmin] Erro ao criar usuário da cozinha', erro);
            const texto = erro instanceof Error
                ? erro.message
                : 'Não foi possível criar o usuário da cozinha agora.';
            setMensagem({ tipo: 'erro', texto });
        } finally {
            setSubmetendoCriacao(false);
        }
    }

    async function handleAlterarSenha(event: FormEvent) {
        event.preventDefault();
        if (!usuarioAtual) return;
        setSubmetendoSenha(true);
        setMensagem(null);
        try {
            await alterarSenhaUsuarioCozinha(novaSenha);
            setMensagem({ tipo: 'sucesso', texto: 'Senha da cozinha atualizada com sucesso.' });
            setNovaSenha('');
        } catch (erro) {
            console.error('[CozinhaAdmin] Erro ao atualizar senha da cozinha', erro);
            const texto = erro instanceof Error ? erro.message : 'Não foi possível atualizar a senha.';
            setMensagem({ tipo: 'erro', texto });
        } finally {
            setSubmetendoSenha(false);
        }
    }

    return (
        <div className={styles.pagina}>
            <header className={styles.cabecalho}>
                <div>
                    <p className={styles.rotulo}>Acesso da cozinha</p>
                    <h1 className={styles.titulo}>Login da cozinha sem email</h1>
                    <p className={styles.subtitulo}>
                        O login é gerado automaticamente com o nome do restaurante e começa com a senha padrão.
                        Atualize a senha para algo seguro e compartilhe com a equipe.
                    </p>
                </div>
                <div className={styles.pillUnico}>
                    <span className={styles.icone}>🍳</span>
                    <div>
                        <p className={styles.pillTitulo}>1 acesso exclusivo</p>
                        <p className={styles.pillTexto}>Somente um usuário por restaurante.</p>
                    </div>
                </div>
            </header>

            {mensagem && (
                <div
                    className={`${styles.mensagem} ${mensagem.tipo === 'sucesso' ? styles.msgSucesso : styles.msgErro}`}
                    role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
                >
                    {mensagem.texto}
                </div>
            )}

            <div className={styles.grade}>
                <section className={`${styles.card} ${styles.cardStatus}`}>
                    <div className={styles.cardHeader}>
                        <p className={styles.cardRotulo}>Status</p>
                        {carregando && <span className={styles.badgeNeutro}>Carregando...</span>}
                        {!carregando && usuarioAtual && <span className={styles.badgeSucesso}>Acesso ativo</span>}
                        {!carregando && !usuarioAtual && <span className={styles.badgeNeutro}>Nenhum acesso</span>}
                    </div>

                    <div className={styles.cardCorpo}>
                        {usuarioAtual ? (
                            <>
                                <p className={styles.cardTitulo}>Login da cozinha</p>
                                <p className={styles.valor}>{usuarioAtual.login}</p>
                                <p className={styles.detalhe}>
                                    Responsável: {usuarioAtual.nome ?? 'Nome não definido'}
                                </p>
                                <p className={styles.detalhe}>
                                    Criado em {formatarDataCurta(usuarioAtual.createdAt) || 'data não disponível'}
                                </p>
                                <p className={styles.dica}>
                                    Use este login na tela /cozinha. Redefina a senha abaixo para personalizar.
                                </p>
                            </>
                        ) : (
                            <>
                                <p className={styles.cardTitulo}>Nenhum login configurado</p>
                                <p className={styles.detalhe}>
                                    Gere um login com o nome do restaurante e senha padrão: {SENHA_PADRAO_COZINHA}.
                                </p>
                                <p className={styles.dica}>
                                    Após gerar, altere a senha para algo seguro e compartilhe com a equipe da cozinha.
                                </p>
                            </>
                        )}
                    </div>

                    <ul className={styles.listaRegras}>
                        <li>Somente um usuário de cozinha por restaurante.</li>
                        <li>Login baseado no nome do restaurante (sem email).</li>
                        <li>Senha inicial padrão: {SENHA_PADRAO_COZINHA}. Personalize antes de usar em produção.</li>
                    </ul>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <p className={styles.cardRotulo}>Criar acesso</p>
                        <p className={styles.cardHint}>O login é gerado automaticamente.</p>
                    </div>

                    <form className={styles.form} onSubmit={(event) => { void handleCriar(event); }}>
                        <label className={styles.label} htmlFor="loginCozinha">Login (nome do restaurante)</label>
                        <input
                            id="loginCozinha"
                            type="text"
                            className={styles.input}
                            placeholder="Será gerado a partir do nome do restaurante"
                            value={usuarioAtual?.login ?? ''}
                            disabled
                        />

                        <Botao
                            type="submit"
                            variante={jaExisteUsuario ? 'secundario' : 'primario'}
                            tamanho="grande"
                            className={styles.botao}
                            carregando={submetendoCriacao}
                            disabled={jaExisteUsuario || carregando}
                        >
                            {jaExisteUsuario ? 'Já existe um acesso criado' : 'Criar acesso da cozinha'}
                        </Botao>
                        <p className={styles.notaUnica}>Senha padrão inicial: {SENHA_PADRAO_COZINHA}.</p>
                    </form>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <p className={styles.cardRotulo}>Atualizar senha da cozinha</p>
                        <p className={styles.cardHint}>Defina uma senha segura e compartilhe com a equipe.</p>
                    </div>
                    <form className={styles.form} onSubmit={(event) => { void handleAlterarSenha(event); }}>
                        <label className={styles.label} htmlFor="novaSenhaCozinha">Nova senha</label>
                        <input
                            id="novaSenhaCozinha"
                            type="password"
                            className={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            value={novaSenha}
                            onChange={(event) => { setNovaSenha(event.target.value); }}
                            minLength={6}
                            disabled={!usuarioAtual}
                            required
                        />
                        <Botao
                            type="submit"
                            variante="primario"
                            tamanho="medio"
                            className={styles.botao}
                            carregando={submetendoSenha}
                            disabled={!usuarioAtual || novaSenha.length < 6}
                        >
                            Atualizar senha
                        </Botao>
                    </form>
                </section>
            </div>
        </div>
    );
}

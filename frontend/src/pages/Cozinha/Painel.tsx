import { useState } from 'react';
import { ProvedorPedidos } from '../../contexts/ContextoPedidos';
import { usePedidos } from '../../hooks/usePedidos';
import { CardPedido } from '../../components/CardPedido';
import { useAlertaSonoro } from '../../hooks/useAlertaSonoro';
import { Botao } from '../../components/Botao';
import { ServicoAuth } from '../../services/ServicoAuth';
import { definirSessao, obterRestauranteId, obterToken } from '../../utils/sessao';
import styles from './styles.module.css';
import { useWakeLock } from '../../hooks/useWakeLock';

function ConteudoPainelCozinha() {
    useWakeLock();

    const {
        pedidosPendentes,
        confirmarPedido,
        marcarComoPronto,
        limparNotificacao
    } = usePedidos();

    const [audioAtivado, setAudioAtivado] = useState(false);
    const [mostrarModalSom, setMostrarModalSom] = useState(true);
    const [restauranteId, setRestauranteId] = useState<string | undefined>(() => obterRestauranteId());
    const [token, setToken] = useState<string | undefined>(() => obterToken());
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [erroLogin, setErroLogin] = useState('');

    const pedidosNaoConfirmados = pedidosPendentes.filter(p => p.status === 'pendente');
    // Toca alerta sempre que houver pedidos pendentes na fila
    const devTocarAlerta = pedidosNaoConfirmados.length > 0;

    const { ativarAudio } = useAlertaSonoro(devTocarAlerta);

    const handleConfirmar = (idPedido: string) => {
        void confirmarPedido(idPedido);
        limparNotificacao();
    };

    const handleAtivarSom = async () => {
        try {
            await ativarAudio();
            setAudioAtivado(true);
            setMostrarModalSom(false);
        } catch (error) {
            console.warn('[PainelCozinha] Não foi possível ativar áudio automaticamente', error);
            setMostrarModalSom(true);
        }
    };

    const handleLoginCozinha = async () => {
        try {
            const resp = await ServicoAuth.loginCozinha(login, senha);
            definirSessao(
                resp.cozinha.restauranteId,
                'cozinha',
                resp.token,
                resp.cozinha.login,
                resp.refreshToken,
            );
            setRestauranteId(resp.cozinha.restauranteId);
            setToken(resp.token);
            setErroLogin('');
        } catch (error) {
            console.error(error);
            setErroLogin('Falha no login da cozinha.');
        }
    };

    if ((restauranteId ?? '') === '' || (token ?? '') === '') {
        return (
            <div className={styles.container}>
                <div className={styles.modalOverlay}>
                    <div className={styles.modalConteudo}>
                        <div className={styles.modalIcone}>🧑‍🍳</div>
                        <h2 className={styles.modalTitulo}>Login da Cozinha</h2>
                        <p className={styles.modalTexto}>
                            Informe o login (nome do restaurante) e a senha definida pelo admin.
                        </p>
                        <input
                            className={styles.inputLogin}
                            type="text"
                            placeholder="nomerestaurante"
                            value={login}
                            onChange={(e) => { setLogin(e.target.value); }}
                        />
                        <input
                            className={styles.inputLogin}
                            type="password"
                            placeholder="senha"
                            value={senha}
                            onChange={(e) => { setSenha(e.target.value); }}
                        />
                        {erroLogin && <p className={styles.erroLogin}>{erroLogin}</p>}
                        <Botao variante="primario" tamanho="grande" onClick={() => { void handleLoginCozinha(); }}>
                            Entrar
                        </Botao>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Modal de Ativação */}
            {mostrarModalSom && !audioAtivado && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalConteudo}>
                        <div className={styles.modalIcone}>🔊</div>
                        <h2 className={styles.modalTitulo}>Ativar Alertas Sonoros</h2>
                        <p className={styles.modalTexto}>
                            Clique para ativar notificações sonoras quando novos pedidos chegarem.
                        </p>
                        <Botao variante="primario" tamanho="grande" onClick={() => { void handleAtivarSom(); }}>
                            🔊 Ativar Som Agora
                        </Botao>
                        <button className={styles.botaoFechar} onClick={() => { setMostrarModalSom(false); }}>
                            Continuar sem som
                        </button>
                    </div>
                </div>
            )}

            <header className={styles.cabecalho}>
                <div className={styles.conteudoCabecalho}>
                    <h1 className={styles.titulo}>👨‍🍳 Painel da Cozinha</h1>
                    <div className={styles.estatisticas}>
                        {!audioAtivado && (
                            <Botao variante="secundario" tamanho="pequeno" onClick={() => { void handleAtivarSom(); }}>
                                🔊 Ativar Som
                            </Botao>
                        )}
                        <div className={styles.badge}>
                            <span className={styles.badgeNumero}>{pedidosNaoConfirmados.length}</span>
                            <span className={styles.badgeLabel}>Novos</span>
                        </div>
                        <div className={styles.badge}>
                            <span className={styles.badgeNumero}>{pedidosPendentes.length}</span>
                            <span className={styles.badgeLabel}>Total</span>
                        </div>
                    </div>
                </div>
                <div className={styles.legenda}>
                    <span className={styles.legendaItem}><span className={`${styles.ponto} ${styles.pontoVerde}`} />Novos</span>
                    <span className={styles.legendaItem}><span className={`${styles.ponto} ${styles.pontoAmarelo}`} />Preparando</span>
                    <span className={styles.legendaItem}><span className={`${styles.ponto} ${styles.pontoVermelho}`} />Atrasados</span>
                </div>
            </header>

            <main className={styles.conteudoPrincipal}>
                {pedidosPendentes.length === 0 ? (
                    <div className={styles.vazio}>
                        <div className={styles.iconeVazio}>😴</div>
                        <h2>Nenhum pedido no momento</h2>
                        <p>Aguardando novos pedidos...</p>
                    </div>
                ) : (
                    <div className={styles.gradePedidos}>
                        {pedidosPendentes.map(pedido => (
                            <CardPedido
                                key={pedido.id}
                                pedido={pedido}
                                aoConfirmar={handleConfirmar}
                                aoMarcarPronto={(id) => { void marcarComoPronto(id); }}
                            />
                        ))}
                    </div>
                )}
            </main>

            {devTocarAlerta && (
                <div className={styles.alertaVisual}>
                    <div className={styles.alertaConteudo}>
                        <span className={styles.alertaIcone}>🔔</span>
                        <span className={styles.alertaTexto}>
                            {pedidosNaoConfirmados.length} novo(s) pedido(s)!
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export function PainelCozinha() {
    return (
        <ProvedorPedidos>
            <ConteudoPainelCozinha />
        </ProvedorPedidos>
    );
}

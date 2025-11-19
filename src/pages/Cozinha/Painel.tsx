import { useState, useEffect } from 'react';
import { ProvedorPedidos, usePedidos } from '../../contexts/ContextoPedidos';
import { CardPedido } from '../../components/CardPedido';
import { useAlertaSonoro } from '../../hooks/useAlertaSonoro';
import { Botao } from '../../components/Botao';
import styles from './styles.module.css';

function ConteudoPainelCozinha() {
    const {
        pedidosPendentes,
        confirmarPedido,
        marcarComoPronto,
        novoPedidoRecebido,
        limparNotificacao
    } = usePedidos();

    const [audioAtivado, setAudioAtivado] = useState(false);
    const [mostrarModalSom, setMostrarModalSom] = useState(true);

    const pedidosNaoConfirmados = pedidosPendentes.filter(p => p.status === 'pendente');
    const devTocarAlerta = pedidosNaoConfirmados.length > 0 && novoPedidoRecebido;

    const { ativarAudio } = useAlertaSonoro(devTocarAlerta);

    const handleConfirmar = (idPedido: string) => {
        confirmarPedido(idPedido);
        limparNotificacao();
    };

    const handleAtivarSom = async () => {
        await ativarAudio();
        setAudioAtivado(true);
        setMostrarModalSom(false);
    };

    // Tentar ativar som automaticamente
    useEffect(() => {
        const tentarAtivar = async () => {
            try {
                await ativarAudio();
                setAudioAtivado(true);
                setMostrarModalSom(false);
            } catch {
                setMostrarModalSom(true);
            }
        };
        tentarAtivar();
    }, []);

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
                        <Botao variante="primario" tamanho="grande" onClick={handleAtivarSom}>
                            🔊 Ativar Som Agora
                        </Botao>
                        <button className={styles.botaoFechar} onClick={() => setMostrarModalSom(false)}>
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
                            <Botao variante="secundario" tamanho="pequeno" onClick={handleAtivarSom}>
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
                                aoMarcarPronto={marcarComoPronto}
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

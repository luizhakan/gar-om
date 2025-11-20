import type { Pedido } from '../../types/Pedido';
import { calcularTempoDecorrido } from '../../utils/formatadores';
import { Botao } from '../Botao';
import styles from './styles.module.css';

interface PropsCardPedido {
    pedido: Pedido;
    aoConfirmar: (idPedido: string) => void;
    aoMarcarPronto: (idPedido: string) => void;
}

export function CardPedido({ pedido, aoConfirmar, aoMarcarPronto }: PropsCardPedido) {
    const tempoDecorrido = calcularTempoDecorrido(pedido.dataCriacao);
    const isPendente = pedido.status === 'pendente';
    const isPreparando = pedido.status === 'preparando';

    const itensEnriquecidos = pedido.itens.map(item => ({
        ...item,
        produto: item.produto,
    }));

    return (
        <div className={`${styles.card} ${isPendente ? styles.pendente : ''} ${isPreparando ? styles.preparando : ''}`}>
            {/* Cabeçalho com destaque para a mesa */}
            <div className={styles.cabecalho}>
                <div className={styles.mesaDestaque}>
                    <span className={styles.labelMesa}>MESA</span>
                    <span className={styles.numeroMesa}>{pedido.idMesa}</span>
                </div>

                <div className={styles.tempo}>
                    <span className={styles.iconeRelogio}>⏱️</span>
                    <span>{tempoDecorrido}</span>
                </div>
            </div>

            {/* Lista de itens */}
            <div className={styles.listaItens}>
                {itensEnriquecidos.map((item, index) => (
                    <div key={index} className={styles.item}>
                        <div className={styles.quantidadeBadge}>{item.quantidade}x</div>
                        <div className={styles.infoItem}>
                            <span className={styles.nomeItem}>
                                {item.produto?.nome ?? 'Produto não encontrado'}
                            </span>
                            {(item.observacao ?? '').trim() !== '' && (
                                <span className={styles.observacao}>
                                    ⚠️ {item.observacao}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ações */}
            <div className={styles.acoes}>
                {isPendente && (
                    <Botao
                        variante="primario"
                        tamanho="grande"
                        onClick={() => { aoConfirmar(pedido.id); }}
                        className={styles.botaoAcao}
                    >
                        ✓ Confirmar Recebimento
                    </Botao>
                )}

                {isPreparando && (
                    <Botao
                        variante="primario"
                        tamanho="grande"
                        onClick={() => { aoMarcarPronto(pedido.id); }}
                        className={styles.botaoAcao}
                    >
                        ✓ Marcar como Pronto
                    </Botao>
                )}
            </div>
        </div>
    );
}

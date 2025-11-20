import { useEffect, useRef, useState } from 'react';
import type { Produto } from '../../types/Produto';
import { Botao } from '../Botao';
import styles from './styles.module.css';

interface PropsModalObservacao {
    aberto: boolean;
    produto?: Produto | null;
    observacaoInicial?: string;
    aoConfirmar: (observacao: string) => void;
    aoCancelar: () => void;
}

export function ModalObservacao({
    aberto,
    produto,
    observacaoInicial = '',
    aoConfirmar,
    aoCancelar,
}: PropsModalObservacao) {
    const [observacao, setObservacao] = useState(observacaoInicial);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (aberto) {
            // Resetar o campo quando o modal abre novamente.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setObservacao(() => observacaoInicial);
            requestAnimationFrame(() => {
                textareaRef.current?.focus();
            });
        }
    }, [aberto, observacaoInicial, produto?.id]);

    if (!aberto || produto === undefined || produto === null) {
        return null;
    }

    const handleConfirmar = () => {
        aoConfirmar(observacao.trim());
    };

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <header className={styles.cabecalho}>
                    <div>
                        <p className={styles.rotulo}>Adicionar observação</p>
                        <h2 className={styles.nomeProduto}>{produto.nome}</h2>
                        {(produto.descricao?.trim() ?? '') !== '' ? (
                            <p className={styles.descricaoProduto}>{produto.descricao}</p>
                        ) : null}
                    </div>
                    <button
                        className={styles.botaoFechar}
                        onClick={aoCancelar}
                        aria-label="Fechar modal de observação"
                    >
                        ×
                    </button>
                </header>

                <label className={styles.labelCampo} htmlFor="observacao">
                    Algum detalhe especial?
                </label>
                <textarea
                    id="observacao"
                    ref={textareaRef}
                    className={styles.textarea}
                    placeholder="Ex: sem cebola, ponto da carne, retirar molho"
                    value={observacao}
                    onChange={(event) => {
                        setObservacao(event.target.value);
                    }}
                    rows={3}
                />

                <div className={styles.acoes}>
                    <Botao variante="secundario" onClick={aoCancelar} className={styles.botaoAcao}>
                        Cancelar
                    </Botao>
                    <Botao variante="primario" onClick={handleConfirmar} className={styles.botaoAcao}>
                        Adicionar ao pedido
                    </Botao>
                </div>
            </div>
        </div>
    );
}

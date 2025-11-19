import styles from './styles.module.css';

interface PropsControleQuantidade {
    quantidade: number;
    aoAlterar: (novaQuantidade: number) => void;
    minimo?: number;
    maximo?: number;
}

export function ControleQuantidade({
    quantidade,
    aoAlterar,
    minimo = 0,
    maximo = 99
}: PropsControleQuantidade) {

    const decrementar = () => {
        if (quantidade > minimo) {
            aoAlterar(quantidade - 1);
        }
    };

    const incrementar = () => {
        if (quantidade < maximo) {
            aoAlterar(quantidade + 1);
        }
    };

    return (
        <div className={styles.controle}>
            <button
                className={styles.botao}
                onClick={decrementar}
                disabled={quantidade <= minimo}
                aria-label="Diminuir quantidade"
            >
                −
            </button>

            <span className={styles.quantidade}>{quantidade}</span>

            <button
                className={styles.botao}
                onClick={incrementar}
                disabled={quantidade >= maximo}
                aria-label="Aumentar quantidade"
            >
                +
            </button>
        </div>
    );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './styles.module.css';

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: 'primario' | 'secundario' | 'perigo';
    carregando?: boolean;
    children: ReactNode;
    tamanho?: 'pequeno' | 'medio' | 'grande';
}

export function Botao({
    variante = 'primario',
    carregando = false,
    children,
    tamanho = 'medio',
    disabled,
    className = '',
    ...rest
}: PropsBotao) {
    return (
        <button
            className={`${styles.botao} ${styles[variante]} ${styles[tamanho]} ${className}`}
            disabled={carregando || disabled}
            {...rest}
        >
            {carregando ? (
                <span className={styles.carregando}>Carregando...</span>
            ) : (
                children
            )}
        </button>
    );
}

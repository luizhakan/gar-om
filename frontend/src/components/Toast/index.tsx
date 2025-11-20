import { useEffect, useRef } from 'react';
import type { TipoToast } from '../../contexts/ContextoToast';
import styles from './toast.module.css';

interface ToastItem {
    id: string;
    mensagem: string;
    tipo: TipoToast;
    duracaoMs: number;
}

interface ToastStackProps {
    toasts: ToastItem[];
    onFechar: (id: string) => void;
}

export function ToastStack({ toasts, onFechar }: ToastStackProps) {
    const primeiroToast = useRef<string | null>(null);

    useEffect(() => {
        if (toasts.length > 0 && primeiroToast.current === null) {
            primeiroToast.current = toasts[0].id;
        } else if (toasts.length === 0) {
            primeiroToast.current = null;
        }
    }, [toasts]);

    return (
        <div className={styles.container} aria-live="polite" aria-atomic="true">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[toast.tipo]}`}
                    role="status"
                    aria-label={toast.tipo}
                >
                    <span className={styles.texto}>{toast.mensagem}</span>
                    <button
                        className={styles.botaoFechar}
                        onClick={() => {
                            onFechar(toast.id);
                        }}
                        aria-label="Fechar toast"
                    >
                        ×
                    </button>
                    <div className={styles.barra} style={{ animationDuration: `${String(toast.duracaoMs)}ms` }} />
                </div>
            ))}
        </div>
    );
}

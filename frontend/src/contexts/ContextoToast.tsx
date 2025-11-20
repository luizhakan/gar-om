import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastStack } from '../components/Toast';

export type TipoToast = 'sucesso' | 'erro' | 'info' | 'aviso';

interface Toast {
    id: string;
    mensagem: string;
    tipo: TipoToast;
    duracaoMs: number;
}

interface ContextoToastDados {
    notificar: (mensagem: string, tipo?: TipoToast, duracaoMs?: number) => void;
}

const ContextoToast = createContext<ContextoToastDados | undefined>(undefined);

function gerarId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
}

interface ProvedorToastProps {
    children: ReactNode;
}

export function ProvedorToast({ children }: ProvedorToastProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    function remover(id: string) {
        setToasts(lista => lista.filter(item => item.id !== id));
    }

    function notificar(mensagem: string, tipo: TipoToast = 'info', duracaoMs = 4000) {
        const toast: Toast = { id: gerarId(), mensagem, tipo, duracaoMs };
        setToasts(lista => [...lista, toast]);
        window.setTimeout(() => remover(toast.id), duracaoMs);
    }

    const valor = useMemo(() => ({ notificar }), []);

    return (
        <ContextoToast.Provider value={valor}>
            {children}
            <ToastStack toasts={toasts} onFechar={remover} />
        </ContextoToast.Provider>
    );
}

export function useToast() {
    const contexto = useContext(ContextoToast);
    if (!contexto) {
        throw new Error('useToast deve ser usado dentro de um ProvedorToast');
    }
    return contexto;
}

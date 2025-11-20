import { useContext } from 'react';
import { ContextoAdmin } from '../contexts/admin-context';

export function useAdmin() {
    const contexto = useContext(ContextoAdmin);

    if (contexto === undefined) {
        throw new Error('useAdmin deve ser usado dentro de um ProvedorAdmin');
    }

    return contexto;
}

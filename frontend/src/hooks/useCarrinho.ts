import { useContext } from 'react';
import { ContextoCarrinho } from '../contexts/carrinho-context';

/**
 * Hook para acessar o contexto do carrinho.
 * Deve ser usado dentro de um ProvedorCarrinho.
 */
export function useCarrinho() {
    const contexto = useContext(ContextoCarrinho);

    if (!contexto) {
        throw new Error('useCarrinho deve ser usado dentro de um ProvedorCarrinho');
    }

    return contexto;
}

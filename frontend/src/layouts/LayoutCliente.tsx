import { Outlet } from 'react-router-dom';
import { ProvedorCarrinho } from '../contexts/ContextoCarrinho';

/**
 * Layout que envolve todas as páginas do cliente com o contexto do carrinho.
 */
export function LayoutCliente() {
    return (
        <ProvedorCarrinho>
            <Outlet />
        </ProvedorCarrinho>
    );
}

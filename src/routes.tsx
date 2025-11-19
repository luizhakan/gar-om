import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { DashboardAdmin } from './pages/Admin/Dashboard';
import { CardapioCliente } from './pages/Cliente/Cardapio';
import { RevisarPedido } from './pages/Cliente/RevisarPedido';
import { PainelCozinha } from './pages/Cozinha/Painel';
import { LayoutCliente } from './layouts/LayoutCliente';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/admin',
        element: <DashboardAdmin />,
    },
    {
        path: '/mesa/:idMesa',
        element: <LayoutCliente />,
        children: [
            {
                index: true,
                element: <CardapioCliente />,
            },
            {
                path: 'revisar',
                element: <RevisarPedido />,
            },
        ],
    },
    {
        path: '/cozinha',
        element: <PainelCozinha />,
    },
]);

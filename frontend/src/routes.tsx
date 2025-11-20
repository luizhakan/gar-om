import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { DashboardAdmin } from './pages/Admin/Dashboard';
import { ProdutosAdmin } from './pages/Admin/Produtos';
import { MesasAdmin } from './pages/Admin/Mesas';
import { LoginAdmin } from './pages/Admin/Login';
import { RegistrarAdmin } from './pages/Admin/Registrar';
import { CardapioCliente } from './pages/Cliente/Cardapio';
import { RevisarPedido } from './pages/Cliente/RevisarPedido';
import { PainelCozinha } from './pages/Cozinha/Painel';
import { LayoutCliente } from './layouts/LayoutCliente';
import { LayoutAdmin } from './layouts/LayoutAdmin';
import { PaginaErro } from './pages/ErroAplicacao';
import { Pagina404 } from './pages/NotFound';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
        errorElement: <PaginaErro />,
    },
    {
        path: '/admin',
        element: <LayoutAdmin />,
        errorElement: <PaginaErro />,
        children: [
            {
                index: true,
                element: <DashboardAdmin />,
            },
            {
                path: 'produtos',
                element: <ProdutosAdmin />,
            },
            {
                path: 'mesas',
                element: <MesasAdmin />,
            },
            {
                path: 'login',
                element: <LoginAdmin />,
            },
            {
                path: 'registro',
                element: <RegistrarAdmin />,
            },
        ],
    },
    {
        path: '/mesa/:idMesa',
        element: <LayoutCliente />,
        errorElement: <PaginaErro />,
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
        errorElement: <PaginaErro />,
    },
    {
        path: '*',
        element: <Pagina404 />,
    },
]);

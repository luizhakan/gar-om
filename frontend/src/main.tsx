import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProvedorToast } from './contexts/ContextoToast';

// Importação do Design System
import './styles/tokens.css';
import './styles/global.css';
import './styles/animacoes.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
    throw new Error('Elemento root não encontrado');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <ProvedorToast>
            <App />
        </ProvedorToast>
    </React.StrictMode>,
);

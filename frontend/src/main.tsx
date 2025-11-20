import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ProvedorToast } from './contexts/ContextoToast.tsx'

// Importação do Design System
import './styles/tokens.css'
import './styles/global.css'
import './styles/animacoes.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvedorToast>
      <App />
    </ProvedorToast>
  </React.StrictMode>,
)

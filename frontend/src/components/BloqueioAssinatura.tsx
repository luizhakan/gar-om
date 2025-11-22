import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import './BloqueioAssinatura.css';

export function BloqueioAssinatura() {
    const navigate = useNavigate();
    const { assinaturaBloqueada, diasAtrasoAssinatura } = useAdmin();

    if (!assinaturaBloqueada) {
        return null;
    }

    return (
        <div className="bloqueio-overlay">
            <div className="bloqueio-modal">
                <div className="bloqueio-icone">🔒</div>
                <h1>Conta Bloqueada</h1>
                <p className="bloqueio-mensagem">
                    Sua assinatura está <strong>{diasAtrasoAssinatura} dias atrasada</strong>.
                </p>
                <p className="bloqueio-descricao">
                    Para continuar usando o sistema, é necessário renovar sua assinatura.
                </p>
                <button 
                    className="btn-renovar-bloqueio"
                    onClick={() => navigate('/admin/assinatura')}
                >
                    Renovar Assinatura Agora
                </button>
            </div>
        </div>
    );
}

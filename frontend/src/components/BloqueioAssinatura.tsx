import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';
import './BloqueioAssinatura.css';

export function BloqueioAssinatura() {
    const navigate = useNavigate();
    const { assinaturaBloqueada, diasAtrasoAssinatura, restauranteInfo } = useAdmin();

    if (!assinaturaBloqueada) {
        return null;
    }

    const statusNaoPermitido = restauranteInfo && 
        !['trialing', 'active'].includes(restauranteInfo.subscriptionStatus);

    return (
        <div className="bloqueio-overlay">
            <div className="bloqueio-modal">
                <div className="bloqueio-icone">🔒</div>
                <h1>Acesso Bloqueado</h1>
                {statusNaoPermitido ? (
                    <p className="bloqueio-mensagem">
                        Sua assinatura está <strong>inválida</strong>.
                    </p>
                ) : diasAtrasoAssinatura > 0 ? (
                    <p className="bloqueio-mensagem">
                        Seu período de trial expirou há{' '}
                        <strong>{diasAtrasoAssinatura} {diasAtrasoAssinatura === 1 ? 'dia' : 'dias'}</strong>.
                    </p>
                ) : (
                    <p className="bloqueio-mensagem">
                        Sua assinatura expirou.
                    </p>
                )}
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

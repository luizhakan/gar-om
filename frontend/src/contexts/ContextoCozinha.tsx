import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ServicoPagamentos, verificarBloqueioAssinatura, type Restaurante } from '../services/ServicoPagamentos';
import { obterRestauranteId, obterToken } from '../utils/sessao';

interface ContextoCozinhaData {
    assinaturaBloqueada: boolean;
    diasAtrasoAssinatura: number;
    restauranteInfo: Restaurante | null;
}

export const ContextoCozinha = createContext<ContextoCozinhaData>({
    assinaturaBloqueada: false,
    diasAtrasoAssinatura: 0,
    restauranteInfo: null,
});

interface ProvedorCozinhaProps {
    children: ReactNode;
}

export function ProvedorCozinha({ children }: ProvedorCozinhaProps) {
    const [restauranteInfo, setRestauranteInfo] = useState<Restaurante | null>(null);
    const [assinaturaBloqueada, setAssinaturaBloqueada] = useState(false);
    const [diasAtrasoAssinatura, setDiasAtrasoAssinatura] = useState(0);

    useEffect(() => {
        const token = obterToken();
        const restauranteId = obterRestauranteId();

        if (!token || !restauranteId) {
            setRestauranteInfo(null);
            setAssinaturaBloqueada(false);
            setDiasAtrasoAssinatura(0);
            return;
        }

        // Adiciona um pequeno delay para garantir que o token seja válido
        const timer = setTimeout(() => {
            ServicoPagamentos.obterRestaurante()
                .then((dados) => {
                    setRestauranteInfo(dados);
                    const { bloqueado, diasAtraso } = verificarBloqueioAssinatura(dados);
                    setAssinaturaBloqueada(bloqueado);
                    setDiasAtrasoAssinatura(diasAtraso);
                    
                    if (bloqueado) {
                        console.log('[ProvedorCozinha] Assinatura bloqueada:', diasAtraso, 'dias');
                    }
                })
                .catch((erro: unknown) => {
                    console.error('[ProvedorCozinha] Erro ao verificar assinatura:', erro);
                });
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return (
        <ContextoCozinha.Provider
            value={{
                assinaturaBloqueada,
                diasAtrasoAssinatura,
                restauranteInfo,
            }}
        >
            {children}
        </ContextoCozinha.Provider>
    );
}

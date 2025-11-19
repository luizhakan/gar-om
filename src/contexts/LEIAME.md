# Contexts (Contextos)

Esta pasta contém os Contextos do React (Context API) para gerenciamento de estado global.
Use contextos para dados que precisam ser acessados por muitos componentes em níveis diferentes da árvore (ex: Usuário Logado, Carrinho de Compras, Tema).

## Padrão de Código (PT-BR)

### Exemplo: `ContextoAutenticacao.tsx`

```tsx
import { createContext, useState, useContext, ReactNode } from 'react';

interface Usuario {
  id: string;
  email: string;
  nome: string;
}

interface DadosContextoAuth {
  usuario: Usuario | null;
  logar: (email: string) => Promise<void>;
  deslogar: () => void;
  estaAutenticado: boolean;
}

const ContextoAutenticacao = createContext<DadosContextoAuth>({} as DadosContextoAuth);

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  async function logar(email: string) {
    // Simulação de login
    setUsuario({ id: '1', email, nome: 'Admin' });
  }

  function deslogar() {
    setUsuario(null);
  }

  return (
    <ContextoAutenticacao.Provider value={{ 
      usuario, 
      logar, 
      deslogar,
      estaAutenticado: !!usuario 
    }}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

// Hook para facilitar o uso do contexto
export function useContextoAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) {
    throw new Error('useContextoAutenticacao deve ser usado dentro de um ProvedorAutenticacao');
  }
  return contexto;
}
```

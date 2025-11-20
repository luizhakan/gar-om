type TipoSessao = 'admin' | 'cozinha' | 'cliente';

type DadosSessao = {
    restauranteId: string;
    tipo: TipoSessao;
    token?: string;
    email?: string;
};

const CHAVE_SESSAO = 'garcom_sessao';

function lerSessao(): DadosSessao | undefined {
    if (typeof window === 'undefined') return undefined;
    const bruto = window.localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return undefined;
    try {
        const parsed = JSON.parse(bruto) as DadosSessao;
        if (!parsed?.restauranteId || !parsed?.tipo) return undefined;
        return parsed;
    } catch {
        return undefined;
    }
}

export function definirSessao(restauranteId: string, tipo: TipoSessao, token?: string, email?: string) {
    if (typeof window === 'undefined') return;
    const dados: DadosSessao = { restauranteId, tipo, token, email };
    window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
    window.dispatchEvent(new Event('sessao-atualizada'));
}

export function limparSessao() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CHAVE_SESSAO);
    window.dispatchEvent(new Event('sessao-atualizada'));
}

export function obterRestauranteId(): string | undefined {
    return lerSessao()?.restauranteId;
}

export function obterTipoSessao(): TipoSessao | undefined {
    return lerSessao()?.tipo;
}

export function obterToken(): string | undefined {
    return lerSessao()?.token;
}

export function obterEmailSessao(): string | undefined {
    return lerSessao()?.email;
}

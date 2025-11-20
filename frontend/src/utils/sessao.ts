type TipoSessao = 'admin' | 'cozinha';

const CHAVE_RESTAURANTE = 'sessao_restaurante_id';
const CHAVE_TIPO = 'sessao_tipo';

export function definirSessao(restauranteId: string, tipo: TipoSessao) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAVE_RESTAURANTE, restauranteId);
    window.localStorage.setItem(CHAVE_TIPO, tipo);
}

export function limparSessao() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CHAVE_RESTAURANTE);
    window.localStorage.removeItem(CHAVE_TIPO);
}

export function obterRestauranteId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage.getItem(CHAVE_RESTAURANTE) || undefined;
}

export function obterTipoSessao(): TipoSessao | undefined {
    if (typeof window === 'undefined') return undefined;
    const valor = window.localStorage.getItem(CHAVE_TIPO) as TipoSessao | null;
    return valor || undefined;
}

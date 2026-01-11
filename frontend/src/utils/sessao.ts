type TipoSessao = 'admin' | 'cozinha' | 'cliente' | 'master';

interface DadosSessao {
    restauranteId?: string;
    tipo: TipoSessao;
    token?: string;
    refreshToken?: string;
    email?: string;
    comandaId?: string;
    tokenComanda?: string;
    codigoComanda?: string;
}

const CHAVE_SESSAO = 'garcom_sessao';
const CHAVE_SESSAO_CLIENTE = 'garcom_sessao_cliente';

function lerSessao(): DadosSessao | undefined {
    if (typeof window === 'undefined') return undefined;
    const bruto = window.localStorage.getItem(CHAVE_SESSAO);
    if ((bruto ?? '') === '') return undefined;
    try {
        const parsed = JSON.parse(bruto ?? '') as Partial<DadosSessao>;
        if ((parsed.tipo ?? '') === '') return undefined;
        const precisaRestaurante = parsed.tipo !== 'master';
        if (precisaRestaurante && (parsed.restauranteId ?? '') === '') return undefined;
        return parsed as DadosSessao;
    } catch {
        return undefined;
    }
}

function lerSessaoCliente(): DadosSessao | undefined {
    if (typeof window === 'undefined') return undefined;
    const bruto = window.localStorage.getItem(CHAVE_SESSAO_CLIENTE);
    if ((bruto ?? '') === '') return undefined;
    try {
        const parsed = JSON.parse(bruto ?? '') as Partial<DadosSessao>;
        if ((parsed.restauranteId ?? '') === '') return undefined;
        return {
            restauranteId: parsed.restauranteId as string,
            tipo: 'cliente',
            comandaId: parsed.comandaId as string | undefined,
            tokenComanda: parsed.tokenComanda as string | undefined,
            codigoComanda: parsed.codigoComanda as string | undefined,
        };
    } catch {
        return undefined;
    }
}

function salvarSessaoCliente(dados: DadosSessao) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAVE_SESSAO_CLIENTE, JSON.stringify(dados));
    window.dispatchEvent(new Event('sessao-atualizada'));
}

export function definirSessao(
    restauranteId: string | undefined,
    tipo: TipoSessao,
    token?: string,
    email?: string,
    refreshToken?: string,
    comandaId?: string,
    tokenComanda?: string,
    codigoComanda?: string,
) {
    if (typeof window === 'undefined') return;
    const dados: DadosSessao = { restauranteId, tipo, token, email, refreshToken };

    if (tipo === 'cliente') {
        const atual = lerSessaoCliente();
        const mudouRestaurante = Boolean(atual?.restauranteId)
            && Boolean(restauranteId)
            && atual?.restauranteId !== restauranteId;
        const comandaIdFinal = mudouRestaurante ? comandaId : (comandaId ?? atual?.comandaId);
        const tokenComandaFinal = mudouRestaurante ? tokenComanda : (tokenComanda ?? atual?.tokenComanda);
        const codigoComandaFinal = mudouRestaurante ? codigoComanda : (codigoComanda ?? atual?.codigoComanda);
        salvarSessaoCliente({
            restauranteId,
            tipo,
            comandaId: comandaIdFinal,
            tokenComanda: tokenComandaFinal,
            codigoComanda: codigoComandaFinal,
        });
    } else {
        window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
        window.dispatchEvent(new Event('sessao-atualizada'));
    }
}

export function limparSessao() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CHAVE_SESSAO);
    window.localStorage.removeItem(CHAVE_SESSAO_CLIENTE);
    window.dispatchEvent(new Event('sessao-atualizada'));
}

export function obterRestauranteId(): string | undefined {
    return lerSessao()?.restauranteId ?? lerSessaoCliente()?.restauranteId;
}

export function obterTipoSessao(): TipoSessao | undefined {
    return lerSessao()?.tipo ?? lerSessaoCliente()?.tipo;
}

export function obterToken(): string | undefined {
    return lerSessao()?.token;
}

export function obterComandaId(): string | undefined {
    return lerSessaoCliente()?.comandaId;
}

export function obterTokenComanda(): string | undefined {
    return lerSessaoCliente()?.tokenComanda;
}

export function obterCodigoComanda(): string | undefined {
    return lerSessaoCliente()?.codigoComanda;
}

export function definirComandaSessao(comandaId: string, tokenComanda: string, codigoComanda?: string) {
    const atual = lerSessaoCliente();
    if (!atual?.restauranteId) return;
    salvarSessaoCliente({
        restauranteId: atual.restauranteId,
        tipo: 'cliente',
        comandaId,
        tokenComanda,
        codigoComanda,
    });
}

export function limparComandaSessao() {
    const atual = lerSessaoCliente();
    if (!atual?.restauranteId) return;
    salvarSessaoCliente({ restauranteId: atual.restauranteId, tipo: 'cliente' });
}

export function obterEmailSessao(): string | undefined {
    return lerSessao()?.email;
}

export function obterRefreshToken(): string | undefined {
    return lerSessao()?.refreshToken;
}

export function atualizarTokensSessao(token?: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    const atual = lerSessao();
    if (!atual) return;

    const atualizado: DadosSessao = {
        ...atual,
        ...(token !== undefined ? { token } : {}),
        ...(refreshToken !== undefined ? { refreshToken } : {}),
    };

    window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(atualizado));
    window.dispatchEvent(new Event('sessao-atualizada'));
}

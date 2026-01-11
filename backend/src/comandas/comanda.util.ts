import * as crypto from 'crypto';

const CARACTERES_CODIGO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TAMANHO_CODIGO = 6;

export function gerarCodigoComanda(): string {
    const bytes = crypto.randomBytes(TAMANHO_CODIGO);
    let codigo = '';
    for (let i = 0; i < TAMANHO_CODIGO; i += 1) {
        const indice = bytes[i] % CARACTERES_CODIGO.length;
        codigo += CARACTERES_CODIGO[indice];
    }
    return codigo;
}

export function gerarTokenComanda(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function hashTokenComanda(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

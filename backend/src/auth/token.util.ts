import crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

type Role = 'admin' | 'cozinha';

export interface AuthTokenPayload {
    sub: string;
    restauranteId: string;
    role: Role;
    exp: number;
}

type TokenHeader = {
    alg: 'HS256';
    typ: 'JWT';
};

const TOKEN_HEADER: TokenHeader = {
    alg: 'HS256',
    typ: 'JWT',
};

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error('AUTH_SECRET não configurado');
    }
    return secret;
}

function base64UrlEncode(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode<T>(value: string): T {
    return JSON.parse(Buffer.from(value, 'base64url').toString()) as T;
}

function assinarBase(base: string) {
    return crypto.createHmac('sha256', getSecret()).update(base).digest('base64url');
}

export function gerarToken(payload: Omit<AuthTokenPayload, 'exp'>, ttlSegundos = 60 * 60 * 12) {
    const exp = Math.floor(Date.now() / 1000) + ttlSegundos;
    const corpo: AuthTokenPayload = { ...payload, exp };
    const base = `${base64UrlEncode(TOKEN_HEADER)}.${base64UrlEncode(corpo)}`;
    const assinatura = assinarBase(base);
    return `${base}.${assinatura}`;
}

export function validarToken(token?: string): AuthTokenPayload {
    if (!token) throw new UnauthorizedException('Token ausente');

    const partes = token.split('.');
    if (partes.length !== 3) throw new UnauthorizedException('Token inválido');
    const [headerB64, payloadB64, assinaturaRecebida] = partes;

    const base = `${headerB64}.${payloadB64}`;
    const assinaturaEsperada = assinarBase(base);

    if (
        assinaturaRecebida.length !== assinaturaEsperada.length ||
        !crypto.timingSafeEqual(Buffer.from(assinaturaRecebida), Buffer.from(assinaturaEsperada))
    ) {
        throw new UnauthorizedException('Assinatura inválida');
    }

    const payload = base64UrlDecode<AuthTokenPayload>(payloadB64);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token expirado');
    }

    return payload;
}

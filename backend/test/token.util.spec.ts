import { UnauthorizedException } from '@nestjs/common';
import { gerarToken, validarToken } from '../src/auth/token.util';

describe('token.util', () => {
    beforeAll(() => {
        process.env.AUTH_SECRET = 'segredo-testes';
    });

    it('valida token assinando payload', () => {
        const token = gerarToken({ sub: 'user-1', restauranteId: 'rest-1', role: 'admin' }, 60);
        const payload = validarToken(token);
        expect(payload).toMatchObject({ sub: 'user-1', restauranteId: 'rest-1', role: 'admin' });
    });

    it('rejeita assinaturas erradas', () => {
        const token = gerarToken({ sub: 'user-1', restauranteId: 'rest-1', role: 'admin' }, 60);
        expect(() => validarToken(`${token}xyz`)).toThrow(UnauthorizedException);
    });

    it('rejeita expiração', () => {
        const token = gerarToken({ sub: 'user-1', restauranteId: 'rest-1', role: 'admin' }, -1);
        expect(() => validarToken(token)).toThrow(UnauthorizedException);
    });
});

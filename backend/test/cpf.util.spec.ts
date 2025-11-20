import { cpfValidoOuErro } from '../src/auth/dto/admin-register.dto';
import { validarCpf } from '../src/auth/cpf.util';

describe('CPF utilitário', () => {
    it('valida CPFs corretos', () => {
        expect(validarCpf('529.982.247-25')).toBe(true);
        expect(validarCpf('11144477735')).toBe(true);
    });

    it('rejeita CPFs inválidos', () => {
        expect(validarCpf('123')).toBe(false);
        expect(validarCpf('11111111111')).toBe(false);
        expect(validarCpf('52998224724')).toBe(false);
    });

    it('lança erro quando CPF é inválido no helper', () => {
        expect(() => cpfValidoOuErro('11111111111')).toThrow('CPF inválido');
    });
});

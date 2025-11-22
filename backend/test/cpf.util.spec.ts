import { documentoValidoOuErro } from '../src/auth/dto/admin-register.dto';
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

    it('lança erro quando documento não tem 11 ou 14 dígitos', () => {
        expect(() => documentoValidoOuErro('11111111111')).not.toThrow();
        expect(() => documentoValidoOuErro('12345678901234')).not.toThrow();
        expect(() => documentoValidoOuErro('123')).toThrow('CPF/CNPJ inválido');
    });
});

export function validarCpf(valor: string): boolean {
    const cpf = valor.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    const calcDigito = (base: string, multiplicadorInicial: number) => {
        let soma = 0;
        for (let i = 0; i < base.length; i++) {
            soma += parseInt(base.charAt(i), 10) * (multiplicadorInicial - i);
        }
        const resto = soma % 11;
        const digito = resto < 2 ? 0 : 11 - resto;
        return digito;
    };

    const corpo = cpf.slice(0, 9);
    const digito1 = calcDigito(corpo, 10);
    const digito2 = calcDigito(corpo + digito1, 11);

    return cpf === corpo + String(digito1) + String(digito2);
}

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { validarCpf } from '../cpf.util';

export class AdminRegisterDto {
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    cpf!: string;

    @IsString()
    @MinLength(6)
    senha!: string;
}

export function cpfValidoOuErro(cpf: string) {
    if (!validarCpf(cpf)) {
        throw new Error('CPF inválido');
    }
}

import { BadRequestException } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminRegisterDto {
    @IsNotEmpty()
    @IsString()
    nome!: string;

    @IsNotEmpty()
    @IsString()
    nomeRestaurante!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    cpfCnpj!: string;

    @IsString()
    @MinLength(6)
    senha!: string;
}

export function documentoValidoOuErro(cpfCnpj: string) {
    const apenasDigitos = cpfCnpj.replace(/\D/g, '');
    if (apenasDigitos.length !== 11 && apenasDigitos.length !== 14) {
        throw new BadRequestException('CPF/CNPJ inválido');
    }
}

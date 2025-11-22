import { IsString, MinLength } from 'class-validator';

export class AlterarSenhaCozinhaDto {
    @IsString()
    @MinLength(6)
    novaSenha!: string;
}

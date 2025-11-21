import { IsString, MinLength } from 'class-validator';

export class AlterarSenhaAdminDto {
    @IsString()
    senhaAtual!: string;

    @IsString()
    @MinLength(6)
    novaSenha!: string;
}

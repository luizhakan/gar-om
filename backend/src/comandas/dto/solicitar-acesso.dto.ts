import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SolicitarAcessoDto {
    @IsString()
    @IsNotEmpty()
    codigo!: string;

    @IsString()
    @IsOptional()
    apelido?: string;
}

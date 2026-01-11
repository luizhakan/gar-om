import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SolicitarAcessoMesaDto {
    @IsString()
    @IsNotEmpty()
    idMesa!: string;

    @IsString()
    @IsOptional()
    apelido?: string;
}

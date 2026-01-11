import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class AdicionarMesasLoteDto {
    @IsInt()
    @IsNotEmpty()
    @Min(1)
    inicio!: number;

    @IsInt()
    @IsNotEmpty()
    @Min(1)
    fim!: number;

    @IsString()
    @IsUrl({ require_tld: false })
    @IsOptional()
    baseUrl?: string;
}

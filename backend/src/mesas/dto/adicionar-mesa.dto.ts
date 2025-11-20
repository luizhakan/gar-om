import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AdicionarMesaDto {
    @IsInt()
    @IsNotEmpty()
    numero!: number;

    @IsString()
    @IsUrl()
    @IsOptional()
    baseUrl?: string;
}

import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class ConfigurarMesasDto {
    @IsInt()
    @Min(1)
    @IsNotEmpty()
    total!: number;

    @IsString()
    @IsUrl({ require_tld: false })
    @IsOptional()
    baseUrl?: string;
}

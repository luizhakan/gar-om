import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ConfigurarMesasDto {
    @IsInt()
    @Min(1)
    @Max(200)
    total!: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    baseUrl?: string;
}

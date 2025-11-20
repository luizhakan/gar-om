import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarCategoriaDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsString()
    @IsNotEmpty()
    nome!: string;

    @IsInt()
    ordem!: number;
}

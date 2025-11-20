import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CriarProdutoDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsString()
    @IsNotEmpty()
    nome: string;

    @IsOptional()
    @IsString()
    descricao?: string;

    @IsNumber()
    preco: number;

    @IsString()
    @IsNotEmpty()
    idCategoria: string;

    @IsOptional()
    @IsBoolean()
    disponivel?: boolean;

    @IsOptional()
    @IsString()
    imagemUrl?: string;
}

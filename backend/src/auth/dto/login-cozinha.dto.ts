import { IsString, MinLength } from 'class-validator';

export class LoginCozinhaDto {
    @IsString()
    login!: string;

    @IsString()
    @MinLength(6)
    senha!: string;
}

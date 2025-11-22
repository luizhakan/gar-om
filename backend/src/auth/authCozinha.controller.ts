import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCozinhaDto } from './dto/login-cozinha.dto';

@Controller('auth/cozinha')
export class AuthCozinhaController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() dto: LoginCozinhaDto) {
        return this.authService.loginCozinha(dto);
    }
}

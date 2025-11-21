import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler'; // Importar
import { AdminRegisterDto } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth/admin')
export class AuthAdminController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    registrar(@Body() dto: AdminRegisterDto) {
        return this.authService.registrarAdmin(dto);
    }

    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas/min
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.loginAdmin(dto);
    }
}

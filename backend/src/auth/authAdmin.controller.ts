import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth/admin')
export class AuthAdminController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    registrar(@Body() dto: AdminRegisterDto) {
        return this.authService.registrarAdmin(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.loginAdmin(dto);
    }
}

import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';
import { AlterarSenhaAdminDto } from './dto/alterar-senha-admin.dto';
import { AuthGuard, Roles } from './auth.guard';
import { SkipSubscriptionCheck } from './subscription.guard';
import { UsuarioAutenticado } from './auth-user.decorator';
import type { AuthTokenPayload } from './token.util';

@Controller('auth')
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

    @Post('refresh')
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @Post('password')
    alterarSenha(
        @UsuarioAutenticado() usuario: AuthTokenPayload,
        @Body() dto: AlterarSenhaAdminDto,
    ) {
        return this.authService.alterarSenhaAdmin(usuario.sub, dto);
    }

    @UseGuards(AuthGuard)
    @Roles('admin')
    @SkipSubscriptionCheck()
    @Get('restaurante')
    obterRestaurante(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.authService.obterRestaurante(usuario.restauranteId);
    }
}

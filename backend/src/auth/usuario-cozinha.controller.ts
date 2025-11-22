import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard, Roles } from './auth.guard';
import { UsuarioAutenticado } from './auth-user.decorator';
import type { AuthTokenPayload } from './token.util';
import { AlterarSenhaCozinhaDto } from './dto/alterar-senha-cozinha.dto';

@UseGuards(AuthGuard)
@Roles('admin')
@Controller('cozinha/usuario')
export class UsuarioCozinhaController {
    constructor(private readonly authService: AuthService) {}

    @Get()
    obter(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.authService.obterUsuarioCozinha(usuario.restauranteId);
    }

    @Post()
    criar(@UsuarioAutenticado() usuario: AuthTokenPayload) {
        return this.authService.criarUsuarioCozinha(usuario.restauranteId);
    }

    @Patch('senha')
    atualizarSenha(
        @UsuarioAutenticado() usuario: AuthTokenPayload,
        @Body() dto: AlterarSenhaCozinhaDto,
    ) {
        return this.authService.alterarSenhaUsuarioCozinha(usuario.restauranteId, dto);
    }
}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthAdminController } from './authAdmin.controller';
import { AuthCozinhaController } from './authCozinha.controller';
import { AuthGuard } from './auth.guard';

@Module({
    controllers: [AuthAdminController, AuthCozinhaController],
    providers: [AuthService, AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule {}

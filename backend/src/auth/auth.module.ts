import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthAdminController } from './authAdmin.controller';
import { AuthCozinhaController } from './authCozinha.controller';

@Module({
    controllers: [AuthAdminController, AuthCozinhaController],
    providers: [AuthService],
})
export class AuthModule {}

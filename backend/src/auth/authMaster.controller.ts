import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth/master')
export class AuthMasterController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.loginMaster(dto);
    }
}

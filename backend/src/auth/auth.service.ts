import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRegisterDto, cpfValidoOuErro } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async registrarAdmin(dto: AdminRegisterDto) {
        cpfValidoOuErro(dto.cpf);

        const cpfLimpo = dto.cpf.replace(/\D/g, '');
        const existe = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (existe) {
            throw new UnauthorizedException('Email já cadastrado');
        }

        const senhaHash = await bcrypt.hash(dto.senha, 10);

        const restaurante = await this.prisma.restaurante.create({
            data: {
                nome: `${dto.nome} - Restaurante`,
            },
        });

        const admin = await this.prisma.admin.create({
            data: {
                nome: dto.nome,
                email: dto.email,
                cpf: cpfLimpo,
                senhaHash,
                restauranteId: restaurante.id,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                cpf: true,
                restauranteId: true,
            },
        });

        return { admin };
    }

    async loginAdmin(dto: LoginDto) {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (!admin) throw new NotFoundException('Admin não encontrado');

        const ok = await bcrypt.compare(dto.senha, admin.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        // Simplificado: retorna payload básico (pode trocar por JWT depois)
        return {
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                restauranteId: admin.restauranteId,
            },
        };
    }

    async loginCozinha(dto: LoginDto) {
        const user = await this.prisma.usuarioCozinha.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException('Usuário da cozinha não encontrado');

        const ok = await bcrypt.compare(dto.senha, user.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        return {
            cozinha: {
                id: user.id,
                email: user.email,
                restauranteId: user.restauranteId,
            },
        };
    }
}

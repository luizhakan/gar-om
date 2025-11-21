import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRegisterDto, cpfValidoOuErro } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';
import { gerarToken } from './token.util';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutos
const REFRESH_TTL_DAYS = 14; // expiração absoluta
const REFRESH_INACTIVITY_DAYS = 5; // expiração por inatividade

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    private adicionarDias(base: Date, dias: number) {
        const copia = new Date(base);
        copia.setDate(base.getDate() + dias);
        return copia;
    }

    // Função auxiliar para gerar o par de tokens e salvar no banco
    private async gerarTokensRotativos(userId: string, role: 'admin' | 'cozinha' | 'master', restauranteId = '') {
        // 1. Access Token (15 minutos)
        const accessToken = gerarToken({ 
            sub: userId, 
            role,
            // Em produção, adicione restauranteId aqui se tiver o dado fácil
            restauranteId,
        }, ACCESS_TOKEN_TTL_SECONDS); 

        // 2. Refresh Token (7 dias)
        const segredo = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(segredo, 10);
        const validade = new Date();
        validade.setDate(validade.getDate() + REFRESH_TTL_DAYS);

        // 3. Salva no banco
        const dados: any = {
            tokenHash: hash,
            expiresAt: validade,
            lastUsedAt: new Date(),
        };

        if (role === 'admin') dados.adminId = userId;
        else if (role === 'cozinha') dados.cozinhaId = userId;
        else dados.masterId = userId;

        const registro = await this.prisma.refreshToken.create({ data: dados });

        // Retorna o formato "ID.SEGREDO" para o cliente
        const refreshToken = `${registro.id}.${segredo}`;

        return { accessToken, refreshToken };
    }

    async registrarAdmin(dto: AdminRegisterDto) {
        cpfValidoOuErro(dto.cpf);
        const cpfLimpo = dto.cpf.replace(/\D/g, '');
        
        const existe = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (existe) throw new UnauthorizedException('Email já cadastrado');

        const cpfExiste = await this.prisma.admin.findUnique({ where: { cpf: cpfLimpo } });
        if (cpfExiste) throw new UnauthorizedException('CPF já cadastrado');

        const senhaHash = await bcrypt.hash(dto.senha, 10);

        const agora = new Date();
        const trialTerminaEm = this.adicionarDias(agora, 30);

        const restaurante = await this.prisma.restaurante.create({
            data: { 
                nome: `${dto.nome} - Restaurante`,
                billingEmail: dto.email,
                trialStartedAt: agora,
                trialEndsAt: trialTerminaEm,
                subscriptionStatus: SubscriptionStatus.trialing,
                planLabel: 'Trial 14 dias',
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
        });

        // Gera tokens iniciais
        const tokens = await this.gerarTokensRotativos(admin.id, 'admin', restaurante.id);

        return {
            token: tokens.accessToken, // Compatibilidade com frontend atual
            refreshToken: tokens.refreshToken,
            admin: { id: admin.id, nome: admin.nome, email: admin.email, restauranteId: admin.restauranteId }
        };
    }

    async loginAdmin(dto: LoginDto) {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (!admin) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, admin.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(admin.id, 'admin', admin.restauranteId);

        return {
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            admin: { id: admin.id, nome: admin.nome, email: admin.email, restauranteId: admin.restauranteId }
        };
    }

    async loginCozinha(dto: LoginDto) {
        const user = await this.prisma.usuarioCozinha.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, user.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(user.id, 'cozinha', user.restauranteId);

        return {
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            cozinha: { id: user.id, email: user.email, restauranteId: user.restauranteId }
        };
    }

    async loginMaster(dto: LoginDto) {
        const master = await this.prisma.masterUser.findUnique({ where: { email: dto.email } });
        if (!master) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, master.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(master.id, 'master', 'master');

        return {
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            master: { id: master.id, nome: master.nome, email: master.email },
        };
    }
    
    async refresh(refreshTokenRecebido: string) {
        // 1. Validação básica do formato "ID.SEGREDO"
        const [id, segredo] = refreshTokenRecebido.split('.');
        if (!id || !segredo) {
            throw new UnauthorizedException('Token de refresh malformado');
        }

        // 2. Busca no banco pelo ID
        const registro = await this.prisma.refreshToken.findUnique({
            where: { id },
            include: { admin: true, cozinha: true, master: true } // Precisamos saber de quem é para gerar o novo
        });

        if (!registro) {
            // Cenário de Roubo: O token existia mas foi apagado (já usado)?
            // Em uma implementação avançada, guardaríamos logs de tokens usados para alertar o usuário.
            throw new UnauthorizedException('Token inválido ou expirado');
        }

        // 3. Verifica validade temporal
        if (registro.expiresAt < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id } });
            throw new UnauthorizedException('Sessão expirada, faça login novamente');
        }

        // 3.1 Expiração por inatividade
        // campo lastUsedAt foi adicionado; cast flexível evita quebra se o client não estiver regenerado
        const lastUsed = (registro as any).lastUsedAt ?? registro.createdAt;
        const limiteInatividade = new Date(lastUsed);
        limiteInatividade.setDate(limiteInatividade.getDate() + REFRESH_INACTIVITY_DAYS);
        if (limiteInatividade < new Date()) {
            await this.prisma.refreshToken.delete({ where: { id } });
            throw new UnauthorizedException('Sessão expirada por inatividade');
        }

        // 4. Compara o segredo com o hash
        const segredoValido = await bcrypt.compare(segredo, registro.tokenHash);
        if (!segredoValido) {
            throw new UnauthorizedException('Token inválido');
        }

        // 5. ROTAÇÃO: Deleta o token antigo para que não possa ser usado novamente
        await this.prisma.refreshToken.delete({ where: { id } });

        // 6. Gera novo par de tokens
        let userId = '';
        let role: 'admin' | 'cozinha' | 'master' = 'admin';
        let restauranteId = '';

        if (registro.admin) {
            userId = registro.admin.id;
            role = 'admin';
            restauranteId = registro.admin.restauranteId;
        } else if (registro.cozinha) {
            userId = registro.cozinha.id;
            role = 'cozinha';
            restauranteId = registro.cozinha.restauranteId;
        } else if (registro.master) {
            userId = registro.master.id;
            role = 'master';
            restauranteId = 'master';
        }
        if (!userId) {
            throw new UnauthorizedException('Token inválido');
        }

        const novosTokens = await this.gerarTokensRotativos(userId, role, restauranteId);
        
        // Injeta dados no access token
        const accessTokenFinal = gerarToken({
            sub: userId,
            restauranteId,
            role
        }, 15 * 60);

        return {
            token: accessTokenFinal,
            refreshToken: novosTokens.refreshToken
        };
    }
}

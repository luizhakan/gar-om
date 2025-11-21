import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRegisterDto, cpfValidoOuErro } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';
import { gerarToken } from './token.util';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    // Função auxiliar para gerar o par de tokens e salvar no banco
    private async gerarTokensRotativos(userId: string, role: 'admin' | 'cozinha') {
        // 1. Access Token (15 minutos)
        const accessToken = gerarToken({ 
            sub: userId, 
            role,
            // Em produção, adicione restauranteId aqui se tiver o dado fácil
            restauranteId: '', // Será preenchido no login normal, aqui é simplificado
        }, 15 * 60); 

        // 2. Refresh Token (7 dias)
        const segredo = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(segredo, 10);
        const validade = new Date();
        validade.setDate(validade.getDate() + 30);

        // 3. Salva no banco
        const dados: any = {
            tokenHash: hash,
            expiresAt: validade,
        };

        if (role === 'admin') dados.adminId = userId;
        else dados.cozinhaId = userId;

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

        const restaurante = await this.prisma.restaurante.create({
            data: { nome: `${dto.nome} - Restaurante` },
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
        const tokens = await this.gerarTokensRotativos(admin.id, 'admin');

        // Precisamos re-gerar o access token com o restauranteId correto que agora temos
        const accessTokenComDados = gerarToken({
            sub: admin.id,
            restauranteId: restaurante.id,
            role: 'admin'
        }, 15 * 60);

        return {
            token: accessTokenComDados, // Compatibilidade com frontend atual
            refreshToken: tokens.refreshToken,
            admin: { id: admin.id, nome: admin.nome, email: admin.email, restauranteId: admin.restauranteId }
        };
    }

async loginAdmin(dto: LoginDto) {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (!admin) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, admin.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(admin.id, 'admin');
        
        // Sobrescreve o Access Token genérico com os dados reais do admin
        const accessTokenFinal = gerarToken({
            sub: admin.id,
            restauranteId: admin.restauranteId,
            role: 'admin'
        }, 15 * 60);

        return {
            token: accessTokenFinal,
            refreshToken: tokens.refreshToken,
            admin: { id: admin.id, nome: admin.nome, email: admin.email, restauranteId: admin.restauranteId }
        };
    }

    async loginCozinha(dto: LoginDto) {
        const user = await this.prisma.usuarioCozinha.findUnique({ where: { email: dto.email } });
        if (!user) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, user.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(user.id, 'cozinha');

        const accessTokenFinal = gerarToken({
            sub: user.id,
            restauranteId: user.restauranteId,
            role: 'cozinha'
        }, 15 * 60);

        return {
            token: accessTokenFinal,
            refreshToken: tokens.refreshToken,
            cozinha: { id: user.id, email: user.email, restauranteId: user.restauranteId }
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
            include: { admin: true, cozinha: true } // Precisamos saber de quem é para gerar o novo
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

        // 4. Compara o segredo com o hash
        const segredoValido = await bcrypt.compare(segredo, registro.tokenHash);
        if (!segredoValido) {
            throw new UnauthorizedException('Token inválido');
        }

        // 5. ROTAÇÃO: Deleta o token antigo para que não possa ser usado novamente
        await this.prisma.refreshToken.delete({ where: { id } });

        // 6. Gera novo par de tokens
        let userId = '';
        let role: 'admin' | 'cozinha' = 'admin';
        let restauranteId = '';

        if (registro.admin) {
            userId = registro.admin.id;
            role = 'admin';
            restauranteId = registro.admin.restauranteId;
        } else if (registro.cozinha) {
            userId = registro.cozinha.id;
            role = 'cozinha';
            restauranteId = registro.cozinha.restauranteId;
        }

        const novosTokens = await this.gerarTokensRotativos(userId, role);
        
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

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRegisterDto, documentoValidoOuErro } from './dto/admin-register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginCozinhaDto } from './dto/login-cozinha.dto';
import { gerarToken } from './token.util';
import { AlterarSenhaAdminDto } from './dto/alterar-senha-admin.dto';
import { AlterarSenhaCozinhaDto } from './dto/alterar-senha-cozinha.dto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutos
const REFRESH_TTL_DAYS = 14; // expiração absoluta
const REFRESH_INACTIVITY_DAYS = 5; // expiração por inatividade
const SENHA_PADRAO_COZINHA = process.env.SENHA_PADRAO_COZINHA ?? 'cozinha123';
const TRIAL_DIAS = 14;

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    private adicionarDias(base: Date, dias: number) {
        const copia = new Date(base);
        copia.setDate(base.getDate() + dias);
        return copia;
    }

    private slugificar(nome: string) {
        const slug = nome
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
        return slug || 'cozinha';
    }

    private async gerarLoginCozinha(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({ where: { id: restauranteId } });
        const base = this.slugificar(restaurante?.nome ?? 'cozinha');

        let tentativa = 0;
        let loginGerado = base;

        // Garante login único
        // Evita loop infinito limitando tentativas
        while (tentativa < 5) {
            const existente = await this.prisma.usuarioCozinha.findUnique({ where: { login: loginGerado } });
            if (!existente) return loginGerado;
            tentativa += 1;
            loginGerado = `${base}-${restauranteId.slice(0, 4)}-${tentativa}`;
        }

        throw new BadRequestException('Não foi possível gerar login único para a cozinha');
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
        documentoValidoOuErro(dto.cpfCnpj);
        const documentoLimpo = dto.cpfCnpj.replace(/\D/g, '');
        
        const existe = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (existe) throw new UnauthorizedException('Email já cadastrado');

        const documentoExiste = await this.prisma.admin.findUnique({ where: { cpf: documentoLimpo } });
        if (documentoExiste) throw new UnauthorizedException('CPF/CNPJ já cadastrado');

        const senhaHash = await bcrypt.hash(dto.senha, 10);

        const agora = new Date();
        const trialTerminaEm = this.adicionarDias(agora, TRIAL_DIAS);

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
                cpf: documentoLimpo,
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

    async loginCozinha(dto: LoginCozinhaDto) {
        const user = await this.prisma.usuarioCozinha.findUnique({ where: { login: dto.login } });
        if (!user) throw new NotFoundException('Credenciais inválidas');

        const ok = await bcrypt.compare(dto.senha, user.senhaHash);
        if (!ok) throw new UnauthorizedException('Credenciais inválidas');

        const tokens = await this.gerarTokensRotativos(user.id, 'cozinha', user.restauranteId);

        return {
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            cozinha: { id: user.id, login: user.login, restauranteId: user.restauranteId }
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

    async alterarSenhaAdmin(adminId: string, dto: AlterarSenhaAdminDto) {
        const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin) throw new NotFoundException('Admin não encontrado');

        const senhaConfere = await bcrypt.compare(dto.senhaAtual, admin.senhaHash);
        if (!senhaConfere) throw new UnauthorizedException('Senha atual incorreta');

        const novaHash = await bcrypt.hash(dto.novaSenha, 10);

        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { senhaHash: novaHash },
        });

        // invalida refresh tokens anteriores desse admin
        await this.prisma.refreshToken.deleteMany({ where: { adminId: admin.id } });

        return { ok: true };
    }

    async obterUsuarioCozinha(restauranteId: string) {
        return this.prisma.usuarioCozinha.findUnique({ where: { restauranteId } });
    }

    async criarUsuarioCozinha(restauranteId: string) {
        const jaExiste = await this.prisma.usuarioCozinha.findUnique({ where: { restauranteId } });
        if (jaExiste) {
            throw new BadRequestException('Já existe um usuário de cozinha para este restaurante.');
        }

        const login = await this.gerarLoginCozinha(restauranteId);
        const senhaHash = await bcrypt.hash(SENHA_PADRAO_COZINHA, 10);

        const criado = await this.prisma.usuarioCozinha.create({
            data: {
                login,
                senhaHash,
                restauranteId,
                nome: 'Cozinha',
            },
        });

        return {
            id: criado.id,
            login: criado.login,
            restauranteId: criado.restauranteId,
            nome: criado.nome,
            createdAt: criado.createdAt,
        };
    }

    async alterarSenhaUsuarioCozinha(restauranteId: string, dto: AlterarSenhaCozinhaDto) {
        const usuario = await this.prisma.usuarioCozinha.findUnique({ where: { restauranteId } });
        if (!usuario) throw new NotFoundException('Usuário da cozinha não encontrado');

        const senhaHash = await bcrypt.hash(dto.novaSenha, 10);
        const atualizado = await this.prisma.usuarioCozinha.update({
            where: { id: usuario.id },
            data: { senhaHash },
        });

        await this.prisma.refreshToken.deleteMany({ where: { cozinhaId: usuario.id } });

        return { id: atualizado.id, login: atualizado.login, restauranteId: atualizado.restauranteId };
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

    async obterRestaurante(restauranteId: string) {
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { id: restauranteId },
            include: {
                pagamentos: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!restaurante) {
            throw new NotFoundException('Restaurante não encontrado');
        }

        return restaurante;
    }
}

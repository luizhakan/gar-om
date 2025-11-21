import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { validarToken } from '../src/auth/token.util';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

// Mock do crypto para garantir determinismo
jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue(Buffer.from('segredo-randomico')),
    createHmac: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('assinatura-fake'),
    }),
    timingSafeEqual: jest.fn().mockReturnValue(true),
}));

jest.mock('bcryptjs');

describe('AuthService', () => {
    let prisma: PrismaMock;
    let service: AuthService;

    beforeAll(() => {
        process.env.AUTH_SECRET = 'segredo-de-teste';
    });

beforeEach(() => {
        prisma = criarPrismaMock();
        service = new AuthService(prisma as any);
        (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        
        // CORREÇÃO CRÍTICA: Configurar retorno padrão do refreshToken
        prisma.refreshToken.create.mockResolvedValue({ id: 'rt-123' });
    });

    it('registra admin com CPF higienizado, cria restaurante e retorna token', async () => {
        prisma.admin.findUnique
            .mockResolvedValueOnce(null) // email
            .mockResolvedValueOnce(null); // cpf
        prisma.restaurante.create.mockResolvedValue({ id: 'rest-1', nome: 'Rest 1' });
        prisma.admin.create.mockResolvedValue({
            id: 'admin-1',
            nome: 'João',
            email: 'joao@teste.com',
            restauranteId: 'rest-1',
        });

        const resposta = await service.registrarAdmin({
            nome: 'João',
            email: 'joao@teste.com',
            cpf: '529.982.247-25',
            senha: 'segredo',
        });

        expect(prisma.admin.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    cpf: '52998224725',
                    senhaHash: 'senha-hash',
                }),
            }),
        );
        expect(resposta.admin).toEqual({
            id: 'admin-1',
            nome: 'João',
            email: 'joao@teste.com',
            restauranteId: 'rest-1',
        });
        expect(typeof resposta.token).toBe('string');
        expect(validarToken(resposta.token)).toMatchObject({ sub: 'admin-1', role: 'admin', restauranteId: 'rest-1' });
    });

    it('impede email duplicado', async () => {
        prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1' });

        await expect(
            service.registrarAdmin({
                nome: 'João',
                email: 'joao@teste.com',
                cpf: '52998224725',
                senha: 'segredo',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('impede CPF duplicado', async () => {
        prisma.admin.findUnique
            .mockResolvedValueOnce(null) // email
            .mockResolvedValueOnce({ id: 'existe' }); // cpf

        await expect(
            service.registrarAdmin({
                nome: 'João',
                email: 'joao@teste.com',
                cpf: '52998224725',
                senha: 'segredo',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('realiza login do admin e emite token', async () => {
        prisma.admin.findUnique.mockResolvedValue({
            id: 'admin-1',
            nome: 'João',
            email: 'joao@teste.com',
            senhaHash: 'senha-hash',
            restauranteId: 'rest-1',
        });

        const resposta = await service.loginAdmin({ email: 'joao@teste.com', senha: 'segredo' });

        expect(validarToken(resposta.token)).toMatchObject({ sub: 'admin-1', role: 'admin', restauranteId: 'rest-1' });
        expect(resposta.admin).toEqual({
            id: 'admin-1',
            nome: 'João',
            email: 'joao@teste.com',
            restauranteId: 'rest-1',
        });
    });

    it('lança erro quando admin não existe', async () => {
        prisma.admin.findUnique.mockResolvedValue(null);

        await expect(service.loginAdmin({ email: 'joao@teste.com', senha: 'segredo' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança erro quando senha está incorreta', async () => {
        prisma.admin.findUnique.mockResolvedValue({
            id: 'admin-1',
            nome: 'João',
            email: 'joao@teste.com',
            senhaHash: 'senha-hash',
            restauranteId: 'rest-1',
        });
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

        await expect(service.loginAdmin({ email: 'joao@teste.com', senha: 'errada' })).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('realiza login da cozinha', async () => {
        prisma.usuarioCozinha.findUnique.mockResolvedValue({
            id: 'cook-1',
            email: 'cozinha@teste.com',
            senhaHash: 'senha',
            restauranteId: 'rest-1',
        });

        const resposta = await service.loginCozinha({ email: 'cozinha@teste.com', senha: '123456' });

        expect(validarToken(resposta.token)).toMatchObject({ sub: 'cook-1', role: 'cozinha', restauranteId: 'rest-1' });
        expect(resposta.cozinha).toEqual({
            id: 'cook-1',
            email: 'cozinha@teste.com',
            restauranteId: 'rest-1',
        });
    });

    it('falha se usuário da cozinha não existe ou senha inválida', async () => {
        prisma.usuarioCozinha.findUnique.mockResolvedValue(null);
        await expect(service.loginCozinha({ email: 'x', senha: 'y' })).rejects.toBeInstanceOf(NotFoundException);

        prisma.usuarioCozinha.findUnique.mockResolvedValue({
            id: 'cook-1',
            email: 'cozinha@teste.com',
            senhaHash: 'hash',
            restauranteId: 'rest-1',
        });
        (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
        await expect(service.loginCozinha({ email: 'x', senha: 'errada' })).rejects.toBeInstanceOf(UnauthorizedException);
    });

describe('refresh', () => {
        it('realiza rotação de token com sucesso', async () => {
            prisma.refreshToken.findUnique.mockResolvedValue({
                id: 'rt-123',
                tokenHash: 'hash-do-segredo',
                expiresAt: new Date(Date.now() + 10000),
                admin: { id: 'admin-1', restauranteId: 'rest-1' }
            });

            const tokenRecebido = 'rt-123.7365677265646f2d72616e646f6d69636f'; 
            const resultado = await service.refresh(tokenRecebido);

            expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-123' } });
            expect(prisma.refreshToken.create).toHaveBeenCalled();
            expect(resultado).toHaveProperty('token');
            expect(resultado).toHaveProperty('refreshToken');
        });

        it('falha se token não existir no banco', async () => {
            prisma.refreshToken.findUnique.mockResolvedValue(null);
            const token = 'rt-999.segredo';
            await expect(service.refresh(token)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});
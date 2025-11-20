import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { validarToken } from '../src/auth/token.util';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

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
});

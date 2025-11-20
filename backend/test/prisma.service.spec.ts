import { PrismaService } from '../src/prisma/prisma.service';

describe('PrismaService', () => {
    const originalEnv = process.env.DATABASE_URL;

    afterEach(() => {
        process.env.DATABASE_URL = originalEnv;
    });

    it('falha se DATABASE_URL não for definido', () => {
        delete process.env.DATABASE_URL;
        expect(() => new PrismaService()).toThrow('DATABASE_URL não configurado');
    });

    it('executa métodos de ciclo de vida quando DATABASE_URL está presente', async () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        const prisma = new PrismaService();
        const connectSpy = jest.spyOn(prisma, '$connect').mockResolvedValue();
        const disconnectSpy = jest.spyOn(prisma, '$disconnect').mockResolvedValue();

        await prisma.onModuleInit();
        await prisma.onModuleDestroy();

        expect(connectSpy).toHaveBeenCalled();
        expect(disconnectSpy).toHaveBeenCalled();
    });
});

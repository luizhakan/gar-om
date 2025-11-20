import { PrismaService } from '../src/prisma/prisma.service';

describe('PrismaService', () => {
    it('executa métodos de ciclo de vida sem tocar no banco real quando mockados', async () => {
        const prisma = new PrismaService();
        const connectSpy = jest.spyOn(prisma, '$connect').mockResolvedValue();
        const disconnectSpy = jest.spyOn(prisma, '$disconnect').mockResolvedValue();

        await prisma.onModuleInit();
        await prisma.onModuleDestroy();

        expect(connectSpy).toHaveBeenCalled();
        expect(disconnectSpy).toHaveBeenCalled();
    });
});

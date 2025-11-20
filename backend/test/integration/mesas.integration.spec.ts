import { MesasService } from '../../src/mesas/mesas.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, closeDatabase, prisma } from './setup';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MesasService (Integration)', () => {
    let service: MesasService;
    let prismaService: PrismaService;
    let restauranteId: string;

    beforeAll(async () => {
        prismaService = new PrismaService();
        await prismaService.$connect();
        service = new MesasService(prismaService);
    });

    afterAll(async () => {
        await closeDatabase();
        await prismaService.$disconnect();
    });

    beforeEach(async () => {
        await cleanDatabase();
        const restaurante = await prisma.restaurante.create({
            data: { nome: 'Restaurante Teste' },
        });
        restauranteId = restaurante.id;
    });

    it('lista mesas do restaurante', async () => {
        await prisma.mesa.create({
            data: {
                id: 'mesa-1',
                numero: 1,
                codigoQr: 'http://test.com/mesa/1',
                restauranteId,
            },
        });

        const mesas = await service.listar(restauranteId);
        expect(mesas).toHaveLength(1);
        expect(mesas[0].numero).toBe(1);
    });

    it('falha ao listar se restaurante não existe', async () => {
        await expect(service.listar('invalid-id')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('recusa URL base inválida', async () => {
        await expect(service.configurar(1, 'notaurl', restauranteId)).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.configurar(1, 'ftp://host', restauranteId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('configura mesas gerando QR com restauranteId', async () => {
        const resultado = await service.configurar(2, 'http://app.test', restauranteId);

        expect(resultado).toHaveLength(2);
        expect(resultado[0].codigoQr).toBe(`http://app.test/mesa/1?restauranteId=${restauranteId}`);
        expect(resultado[1].codigoQr).toBe(`http://app.test/mesa/2?restauranteId=${restauranteId}`);
    });

    it('DEVE FALHAR: deleta mesas mesmo com pedidos associados (foreign key constraint)', async () => {
        await prisma.mesa.create({
            data: {
                id: 'mesa-1',
                numero: 1,
                codigoQr: 'http://test.com/mesa/1',
                restauranteId,
            },
        });

        await prisma.pedido.create({
            data: {
                id: 'pedido-1',
                idMesa: 'mesa-1',
                restauranteId,
                status: 'pendente',
            },
        });

        await expect(service.configurar(3, 'http://app.test', restauranteId))
            .rejects
            .toThrow(/Foreign key constraint|Pedido_idMesa_fkey/);
    });

    it('reconfigura mesas sem pedidos associados', async () => {
        await service.configurar(2, 'http://app.test', restauranteId);
        
        const resultado = await service.configurar(3, 'http://app.test', restauranteId);
        
        expect(resultado).toHaveLength(3);
    });
});

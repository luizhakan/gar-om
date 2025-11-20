import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MesasService } from '../src/mesas/mesas.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('MesasService', () => {
    let prisma: PrismaMock;
    let service: MesasService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new MesasService(prisma as any);
    });

    it('lista mesas do restaurante solicitado', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.mesa.findMany.mockResolvedValue([]);

        await service.listar('rest-1');

        expect(prisma.mesa.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { numero: 'asc' },
        });
    });

    it('falha ao listar se restaurante não existe', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(service.listar('rest-0')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('recusa URL base inválida', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1', nome: 'R' });
        await expect(service.configurar(1, 'notaurl', 'rest-1')).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.configurar(1, 'ftp://host', 'rest-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('falha ao configurar se restaurante não existe', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(service.configurar(1, 'http://app.test', 'rest-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('configura mesas gerando QR com restauranteId', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-10', nome: 'Restaurante' });
        prisma.mesa.findMany.mockResolvedValue([{ id: 'mesa-1', numero: 1, restauranteId: 'rest-10' }]);

        const resultado = await service.configurar(2, 'http://app.test', 'rest-10');

        expect(prisma.mesa.deleteMany).toHaveBeenCalledWith({ where: { restauranteId: 'rest-10' } });
        expect(prisma.mesa.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ codigoQr: 'http://app.test/mesa/1?restauranteId=rest-10' }),
                expect.objectContaining({ codigoQr: 'http://app.test/mesa/2?restauranteId=rest-10' }),
            ]),
        });
        expect(resultado).toEqual([{ id: 'mesa-1', numero: 1, restauranteId: 'rest-10' }]);
    });
});

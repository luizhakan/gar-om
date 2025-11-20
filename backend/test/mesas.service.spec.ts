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

    it('configura mesas para um restaurante existente', async () => {
        prisma.restaurante.upsert.mockResolvedValue({ id: 'rest-10', nome: 'Restaurante' });
        prisma.restaurante.findFirst.mockResolvedValue({ id: 'rest-10', nome: 'Restaurante' });
        prisma.mesa.findMany.mockResolvedValue([{ id: 'mesa-1', numero: 1, restauranteId: 'rest-10' }]);

        const resultado = await service.configurar(2, 'http://app.test', 'rest-10');

        expect(prisma.mesa.deleteMany).toHaveBeenCalledWith({ where: { restauranteId: 'rest-10' } });
        expect(prisma.mesa.createMany).toHaveBeenCalledWith({
            data: [
                {
                    id: 'mesa-1',
                    numero: 1,
                    codigoQr: 'http://app.test/mesa/1',
                    ocupada: false,
                    restauranteId: 'rest-10',
                },
                {
                    id: 'mesa-2',
                    numero: 2,
                    codigoQr: 'http://app.test/mesa/2',
                    ocupada: false,
                    restauranteId: 'rest-10',
                },
            ],
        });
        expect(resultado).toEqual([{ id: 'mesa-1', numero: 1, restauranteId: 'rest-10' }]);
    });

    it('cria restaurante default quando nenhum existe ao configurar', async () => {
        prisma.restaurante.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'rest-default', nome: 'Default' });
        prisma.restaurante.create.mockResolvedValue({ id: 'rest-default', nome: 'Default' });
        prisma.mesa.findMany.mockResolvedValue([{ id: 'mesa-1', numero: 1, restauranteId: 'rest-default' }]);

        await service.configurar(1, 'http://localhost:5173');

        expect(prisma.restaurante.create).toHaveBeenCalledWith({
            data: { id: 'restaurante-default', nome: 'Restaurante Default' },
        });
        expect(prisma.mesa.createMany).toHaveBeenCalledWith({
            data: [
                {
                    id: 'mesa-1',
                    numero: 1,
                    codigoQr: 'http://localhost:5173/mesa/1',
                    ocupada: false,
                    restauranteId: 'rest-default',
                },
            ],
        });
    });
});

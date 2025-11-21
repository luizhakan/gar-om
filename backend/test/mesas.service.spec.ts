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

    // --- Testes Existentes (Mantidos) ---
    it('lista mesas do restaurante solicitado', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.mesa.findMany.mockResolvedValue([]);
        await service.listar('rest-1');
        expect(prisma.mesa.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { numero: 'asc' },
        });
    });

    // --- Novos Testes ---

    describe('adicionar', () => {
        it('impede criar mesa com número duplicado no mesmo restaurante', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-existe' }); // Simula já existir

            await expect(service.adicionar(1, 'http://url.com', 'rest-1'))
                .rejects.toBeInstanceOf(BadRequestException);
        });

        it('cria mesa com sucesso se número estiver livre', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue(null); // Livre
            prisma.mesa.create.mockResolvedValue({ id: 'nova-mesa', numero: 1 });

            await service.adicionar(1, 'http://url.com', 'rest-1');
            expect(prisma.mesa.create).toHaveBeenCalled();
        });
    });

    describe('excluir', () => {
        it('impede excluir mesa com pedidos vinculados', async () => {
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1' });
            prisma.pedido.count.mockResolvedValue(5); // Tem 5 pedidos

            await expect(service.excluir('mesa-1', 'rest-1'))
                .rejects.toThrow('pedidos associados');
        });

        it('exclui mesa sem pedidos', async () => {
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1' });
            prisma.pedido.count.mockResolvedValue(0);

            await service.excluir('mesa-1', 'rest-1');
            expect(prisma.mesa.delete).toHaveBeenCalledWith({ where: { id: 'mesa-1' } });
        });
    });

    describe('fechar (Sessão)', () => {
        it('encerra mesa e arquiva pedidos', async () => {
            // Mock mesa ocupada e com conta pedida
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', ocupada: true, contaSolicitada: true });
            
            await service.fechar('mesa-1', 'rest-1');

            // Verifica se marcou pedidos como encerrados
            expect(prisma.pedido.updateMany).toHaveBeenCalledWith({
                where: { idMesa: 'mesa-1', restauranteId: 'rest-1', encerrado: false },
                data: { encerrado: true }
            });

            // Verifica se liberou a mesa
            expect(prisma.mesa.update).toHaveBeenCalledWith({
                where: { id: 'mesa-1' },
                data: { ocupada: false, contaSolicitada: false }
            });
        });

        it('falha se mesa já estiver livre', async () => {
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', ocupada: false });
            await expect(service.fechar('mesa-1', 'rest-1'))
                .rejects.toThrow('Mesa já está livre');
        });
    });

    describe('obterComanda', () => {
        it('retorna apenas pedidos não encerrados', async () => {
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 10, ocupada: true });
            prisma.pedido.findMany.mockResolvedValue([
                { id: 'ped-1', itens: [] }
            ]);

            const resultado = await service.obterComanda('mesa-1', 'rest-1');

            expect(prisma.pedido.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    idMesa: 'mesa-1',
                    encerrado: false // Ponto crucial
                })
            }));
            expect(resultado).toHaveLength(1);
        });

        it('retorna lista vazia se mesa não estiver ocupada', async () => {
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', ocupada: false });
            const resultado = await service.obterComanda('mesa-1', 'rest-1');
            expect(resultado).toEqual([]);
            expect(prisma.pedido.findMany).not.toHaveBeenCalled();
        });
    });
});
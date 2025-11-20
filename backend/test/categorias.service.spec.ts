import { NotFoundException } from '@nestjs/common';
import { CategoriasService } from '../src/categorias/categorias.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('CategoriasService', () => {
    let prisma: PrismaMock;
    let service: CategoriasService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new CategoriasService(prisma as any);
    });

    it('lista categorias apenas do restaurante informado', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.categoria.findMany.mockResolvedValue([{ id: 'cat-1' }]);

        const resultado = await service.listar('rest-1');

        expect(prisma.categoria.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { ordem: 'asc' },
        });
        expect(resultado).toEqual([{ id: 'cat-1' }]);
    });

    it('falha ao listar se restaurante não existe', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(service.listar('rest-x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cria categoria vinculada ao restaurante', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.categoria.create.mockResolvedValue({ id: 'cat-1', nome: 'Bebidas', ordem: 1 });

        const categoria = await service.criar({ nome: 'Bebidas', ordem: 1, id: 'cat-1' } as any, 'rest-1');

        expect(prisma.categoria.create).toHaveBeenCalledWith({
            data: {
                id: 'cat-1',
                nome: 'Bebidas',
                ordem: 1,
                restaurante: { connect: { id: 'rest-1' } },
            },
        });
        expect(categoria.id).toBe('cat-1');
    });

    it('falha ao criar em restaurante inexistente', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(
            service.criar({ nome: 'Bebidas', ordem: 1, id: 'cat-1' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});

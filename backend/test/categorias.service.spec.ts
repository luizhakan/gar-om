import { CategoriasService } from '../src/categorias/categorias.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('CategoriasService', () => {
    let prisma: PrismaMock;
    let service: CategoriasService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new CategoriasService(prisma as any);
    });

    it('lista categorias ordenadas', async () => {
        prisma.categoria.findMany.mockResolvedValue([]);

        await service.listar();

        expect(prisma.categoria.findMany).toHaveBeenCalledWith({ orderBy: { ordem: 'asc' } });
    });

    it('cria categoria com dados recebidos', async () => {
        prisma.categoria.create.mockResolvedValue({ id: 'cat-1', nome: 'Bebidas', ordem: 1 });

        const categoria = await service.criar({ nome: 'Bebidas', ordem: 1 } as any);

        expect(prisma.categoria.create).toHaveBeenCalledWith({
            data: {
                nome: 'Bebidas',
                ordem: 1,
                restaurante: { connect: { id: 'restaurante-default' } },
            },
        });
        expect(categoria.nome).toBe('Bebidas');
    });
});

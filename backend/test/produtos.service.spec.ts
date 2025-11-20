import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProdutosService } from '../src/produtos/produtos.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('ProdutosService', () => {
    let prisma: PrismaMock;
    let service: ProdutosService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new ProdutosService(prisma as any);
    });

    it('lista produtos apenas do restaurante', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.produto.findMany.mockResolvedValue([]);

        await service.listar('rest-1');

        expect(prisma.produto.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { nome: 'asc' },
        });
    });

    it('falha ao listar sem restaurante válido', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(service.listar('rest-x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cria produto apenas se categoria pertence ao restaurante', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.categoria.findUnique.mockResolvedValue({ id: 'cat-1', restauranteId: 'rest-1' });
        prisma.produto.create.mockResolvedValue({ id: 'p1', nome: 'Café' });

        await service.criar({ nome: 'Café', preco: 5, idCategoria: 'cat-1' } as any, 'rest-1');

        expect(prisma.produto.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    restaurante: { connect: { id: 'rest-1' } },
                    categoria: { connect: { id: 'cat-1' } },
                }),
            }),
        );
    });

    it('nega criar produto em categoria de outro restaurante', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.categoria.findUnique.mockResolvedValue({ id: 'cat-1', restauranteId: 'rest-2' });

        await expect(
            service.criar({ nome: 'Café', preco: 5, idCategoria: 'cat-1' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('nega criar produto em restaurante inexistente', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(
            service.criar({ nome: 'Café', preco: 5, idCategoria: 'cat-1' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('blinda atualizações de outro restaurante e valida categoria', async () => {
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-1' });
        prisma.categoria.findUnique.mockResolvedValue({ id: 'nova-cat', restauranteId: 'rest-2' });

        await expect(
            service.atualizar('p1', { idCategoria: 'nova-cat' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-2' });
        await expect(
            service.atualizar('p1', { nome: 'X' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('nega remover e alternar disponibilidade de produto de outro restaurante', async () => {
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-2', disponivel: true });

        await expect(service.remover('p1', 'rest-1')).rejects.toBeInstanceOf(UnauthorizedException);
        await expect(service.alternarDisponibilidade('p1', 'rest-1')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('alterna disponibilidade do produto do mesmo restaurante', async () => {
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-1', disponivel: true });
        prisma.produto.update.mockResolvedValue({ id: 'p1', restauranteId: 'rest-1', disponivel: false });

        const resposta = await service.alternarDisponibilidade('p1', 'rest-1');

        expect(prisma.produto.update).toHaveBeenCalledWith({
            where: { id: 'p1' },
            data: { disponivel: false },
        });
        expect(resposta.disponivel).toBe(false);
    });
});

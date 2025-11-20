import { NotFoundException } from '@nestjs/common';
import { ProdutosService } from '../src/produtos/produtos.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('ProdutosService', () => {
    let prisma: PrismaMock;
    let service: ProdutosService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new ProdutosService(prisma as any);
    });

    it('lista produtos filtrando por restaurante quando header é enviado', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.produto.findMany.mockResolvedValue([]);

        await service.listar('rest-1');

        expect(prisma.produto.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { nome: 'asc' },
        });
    });

    it('cria produto conectando ao restaurante informado', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.produto.create.mockResolvedValue({ id: 'p1', nome: 'Café' });

        const produto = await service.criar({ nome: 'Café', preco: 5, idCategoria: 'cat-1' } as any, 'rest-1');

        expect(prisma.produto.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    restaurante: { connect: { id: 'rest-1' } },
                }),
            }),
        );
        expect(produto).toEqual({ id: 'p1', nome: 'Café' });
    });

    it('cria produto com restaurante default quando nenhum existe', async () => {
        prisma.restaurante.findFirst.mockResolvedValue(null);
        prisma.produto.create.mockResolvedValue({ id: 'p1', nome: 'Café' });

        await service.criar({ nome: 'Café', preco: 5, idCategoria: 'cat-1' } as any);

        expect(prisma.produto.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    restaurante: { create: { nome: 'Restaurante Default' } },
                }),
            }),
        );
    });

    it('lança erro ao atualizar produto inexistente', async () => {
        prisma.produto.findUnique.mockResolvedValue(null);

        await expect(service.atualizar('p1', { nome: 'Novo' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('alterna disponibilidade do produto', async () => {
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', disponivel: true });
        prisma.produto.update.mockResolvedValue({ id: 'p1', disponivel: false });

        const resposta = await service.alternarDisponibilidade('p1');

        expect(prisma.produto.update).toHaveBeenCalledWith({
            where: { id: 'p1' },
            data: { disponivel: false },
        });
        expect(resposta.disponivel).toBe(false);
    });
});

import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';

describe('PedidosService', () => {
    let prisma: PrismaMock;
    let service: PedidosService;

    beforeEach(() => {
        prisma = criarPrismaMock();
        service = new PedidosService(prisma as any);
    });

    it('lista pedidos formatando número da mesa e itens', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        const pedidoData = {
            id: 'ped-1',
            idMesa: 'mesa-1',
            restauranteId: 'rest-1',
            status: 'pendente',
            dataCriacao: new Date('2024-01-01'),
            dataAtualizacao: null,
            mesa: { id: 'mesa-1', numero: 12 },
            itens: [
                {
                    produtoId: 'prod-1',
                    quantidade: 2,
                    observacao: 'sem cebola',
                    produto: {
                        id: 'prod-1',
                        nome: 'Pizza',
                        descricao: null,
                        preco: 30,
                        idCategoria: 'cat-1',
                        disponivel: true,
                        imagemUrl: null,
                    },
                },
            ],
        };
        prisma.pedido.findMany.mockResolvedValue([pedidoData as any]);

        const [pedido] = await service.listar('rest-1');

        expect(prisma.pedido.findMany).toHaveBeenCalledWith({
            where: { restauranteId: 'rest-1' },
            orderBy: { dataCriacao: 'desc' },
            include: { mesa: true, itens: { include: { produto: true } } },
        });
        expect(pedido.idMesa).toBe('12');
        expect(pedido.itens[0].produto?.nome).toBe('Pizza');
    });

    it('falha ao listar se restaurante não existe', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(service.listar('rest-x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejeita criação sem restauranteId', async () => {
        await expect(
            service.criar({ idMesa: 'mesa-1', itens: [] } as any, ''),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita criação para restaurante inexistente, mesa inexistente e produto de outro restaurante', async () => {
        prisma.restaurante.findUnique.mockResolvedValue(null);
        await expect(
            service.criar({ idMesa: 'mesa-1', itens: [] } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);

        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.mesa.findFirst.mockResolvedValue(null);
        await expect(
            service.criar({ idMesa: 'mesa-1', itens: [] } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);

        prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 1, restauranteId: 'rest-1' });
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'outro', preco: 10 });
        await expect(
            service.criar({ idMesa: 'mesa-1', itens: [{ idProduto: 'p1', quantidade: 1 }] } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('cria pedido para restaurante e mesa válidos forçando status pendente', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 3, restauranteId: 'rest-1' });
        prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-1', preco: 10 });
        prisma.pedido.create.mockResolvedValue({
            id: 'ped-1',
            idMesa: 'mesa-1',
            restauranteId: 'rest-1',
            status: 'pendente',
            dataCriacao: new Date('2024-01-01'),
            dataAtualizacao: null,
            mesa: { id: 'mesa-1', numero: 3 },
            itens: [
                {
                    produtoId: 'p1',
                    quantidade: 1,
                    observacao: null,
                    produto: { id: 'p1', restauranteId: 'rest-1', preco: 10 },
                },
            ],
        } as any);

        const pedido = await service.criar(
            { idMesa: 'mesa-1', status: 'pronto', itens: [{ idProduto: 'p1', quantidade: 1 }] } as any,
            'rest-1',
        );

        expect(prisma.pedido.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    restauranteId: 'rest-1',
                    status: 'pendente',
                }),
            }),
        );
        expect(pedido.status).toBe('pendente');
    });

    it('atualiza status apenas se for do mesmo restaurante', async () => {
        prisma.pedido.findUnique.mockResolvedValue({ id: 'ped-1', restauranteId: 'rest-2' });
        await expect(
            service.atualizarStatus('ped-1', { status: 'preparando' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        prisma.pedido.findUnique.mockResolvedValue({ id: 'ped-1', restauranteId: 'rest-1', status: 'pendente' });
        prisma.pedido.update.mockResolvedValue({
            id: 'ped-1',
            idMesa: 'mesa-1',
            restauranteId: 'rest-1',
            status: 'preparando',
            dataCriacao: new Date('2024-01-01'),
            dataAtualizacao: new Date('2024-01-02'),
            mesa: { id: 'mesa-1', numero: 3 },
            itens: [],
        } as any);

        const retornado = await service.atualizarStatus('ped-1', { status: 'preparando' } as any, 'rest-1');
        expect(retornado.status).toBe('preparando');
        expect(retornado.dataAtualizacao).toBeInstanceOf(Date);
    });

    it('lança erro ao tentar atualizar pedido inexistente', async () => {
        prisma.pedido.findUnique.mockResolvedValue(null);
        await expect(
            service.atualizarStatus('ped-1', { status: 'pendente' } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});

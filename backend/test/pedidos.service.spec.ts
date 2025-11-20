import { NotFoundException } from '@nestjs/common';
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
        expect(pedido.itens[0]).toEqual(
            expect.objectContaining({
                idProduto: 'prod-1',
                quantidade: 2,
                observacao: 'sem cebola',
            }),
        );
        expect(pedido.itens[0].produto?.nome).toBe('Pizza');
    });

    it('lança erro ao criar pedido com produto inexistente', async () => {
        prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 1, restauranteId: 'rest-1' });
        prisma.produto.findUnique.mockResolvedValue(null);

        await expect(
            service.criar({ idMesa: 'mesa-1', itens: [{ idProduto: 'p1', quantidade: 1 }] } as any, 'rest-1'),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cria pedido gerando mesa padrão quando necessário', async () => {
        prisma.mesa.findFirst.mockResolvedValueOnce(null);
        prisma.restaurante.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'rest-default' });
        prisma.restaurante.create.mockResolvedValue({ id: 'rest-default', nome: 'Restaurante Default' });
        prisma.mesa.count.mockResolvedValue(0);
        prisma.mesa.create.mockResolvedValue({
            id: 'mesa-1',
            numero: 1,
            restauranteId: 'rest-default',
            codigoQr: 'http://localhost:5173/mesa/1',
            ocupada: false,
        });
        prisma.produto.findUnique.mockResolvedValue({
            id: 'prod-1',
            nome: 'Pizza',
            preco: 30,
            descricao: null,
            idCategoria: 'cat-1',
            disponivel: true,
        });
        prisma.pedido.create.mockResolvedValue({
            id: 'ped-1',
            idMesa: 'mesa-1',
            restauranteId: 'rest-default',
            status: 'pendente',
            dataCriacao: new Date('2024-01-01'),
            dataAtualizacao: null,
            mesa: { id: 'mesa-1', numero: 1 },
            itens: [
                {
                    produtoId: 'prod-1',
                    quantidade: 1,
                    observacao: undefined,
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
        } as any);

        const pedido = await service.criar(
            { idMesa: 'nova', itens: [{ idProduto: 'prod-1', quantidade: 1 }] } as any,
            undefined,
        );

        expect(prisma.mesa.create).toHaveBeenCalledWith({
            data: {
                id: 'mesa-1',
                numero: 1,
                codigoQr: 'http://localhost:5173/mesa/1',
                ocupada: false,
                restauranteId: 'rest-default',
            },
        });
        expect(pedido.idMesa).toBe('1');
        expect(pedido.itens[0].produto?.preco).toBe(30);
    });

    it('atualiza status de pedido e devolve data de atualização', async () => {
        prisma.pedido.findUnique.mockResolvedValue({ id: 'ped-1' });
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

        const resultado = await service.atualizarStatus('ped-1', { status: 'preparando' } as any);

        expect(prisma.pedido.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ status: 'preparando', dataAtualizacao: expect.any(Date) }),
            }),
        );
        expect(resultado.status).toBe('preparando');
        expect(resultado.dataAtualizacao).toBeInstanceOf(Date);
    });

    it('lança erro ao tentar atualizar status de pedido inexistente', async () => {
        prisma.pedido.findUnique.mockResolvedValue(null);

        await expect(service.atualizarStatus('ped-1', { status: 'pendente' } as any)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});

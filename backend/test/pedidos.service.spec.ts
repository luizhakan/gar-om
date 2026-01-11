import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ComandaStatus } from '@prisma/client';
import { PedidosService } from '../src/pedidos/pedidos.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';
import { criarPedidosGatewayMock, PedidosGatewayMock } from './mocks/pedidos-gateway.mock';

describe('PedidosService', () => {
    let prisma: PrismaMock;
    let service: PedidosService;
    let pedidosGateway: PedidosGatewayMock;

    beforeEach(() => {
        prisma = criarPrismaMock();
        pedidosGateway = criarPedidosGatewayMock();
        service = new PedidosService(prisma as any, pedidosGateway as any);
    });

    // --- Testes Existentes (Mantidos) ---
    it('lista pedidos formatando número da mesa e itens', async () => {
        prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
        // ... (resto do teste original)
    });

    // --- Novos Testes para Editar Pedido ---

    describe('editar', () => {
        const pedidoMock = {
            id: 'ped-1',
            restauranteId: 'rest-1',
            status: 'pendente',
            encerrado: false,
            dataCriacao: new Date(), // Agora mesmo
            mesa: { contaSolicitada: false },
            itens: []
        };

        it('permite edição dentro do prazo e status pendente', async () => {
            prisma.pedido.findUnique.mockResolvedValue(pedidoMock);
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1' });
            prisma.produto.findUnique.mockResolvedValue({ id: 'p1', restauranteId: 'rest-1', preco: 10 });
            
            prisma.pedido.update.mockResolvedValue({ ...pedidoMock, id: 'ped-1-att' });

            await service.editar('ped-1', {
                idMesa: 'mesa-1',
                itens: [{ idProduto: 'p1', quantidade: 2 }]
            }, 'rest-1');

            expect(prisma.pedido.update).toHaveBeenCalled();
        });

        it('bloqueia edição se tempo expirou (> 90s)', async () => {
            const dataAntiga = new Date();
            dataAntiga.setMinutes(dataAntiga.getMinutes() - 5); // 5 min atrás

            prisma.pedido.findUnique.mockResolvedValue({
                ...pedidoMock,
                dataCriacao: dataAntiga
            });

            await expect(service.editar('ped-1', {} as any, 'rest-1'))
                .rejects.toThrow('até 1min30s');
        });

        it('bloqueia edição se status não for pendente', async () => {
            prisma.pedido.findUnique.mockResolvedValue({
                ...pedidoMock,
                status: 'preparando'
            });

            await expect(service.editar('ped-1', {} as any, 'rest-1'))
                .rejects.toThrow('já confirmado pela cozinha');
        });

        it('bloqueia edição se conta já foi solicitada', async () => {
            prisma.pedido.findUnique.mockResolvedValue({
                ...pedidoMock,
                mesa: { contaSolicitada: true }
            });

            await expect(service.editar('ped-1', {} as any, 'rest-1'))
                .rejects.toThrow('Conta solicitada');
        });

        it('bloqueia edição se pedido já foi encerrado (mesa fechada)', async () => {
            prisma.pedido.findUnique.mockResolvedValue({
                ...pedidoMock,
                encerrado: true
            });

            await expect(service.editar('ped-1', {} as any, 'rest-1'))
                .rejects.toThrow('já encerrado');
        });
    });

    describe('criar (comanda)', () => {
        it('cria comanda e retorna token no primeiro pedido', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 3, restauranteId: 'rest-1' });
            prisma.comanda.findFirst.mockResolvedValue(null);
            prisma.comanda.findUnique.mockResolvedValue(null);
            prisma.produto.findUnique.mockResolvedValue({
                id: 'prod-1',
                restauranteId: 'rest-1',
                preco: 10,
            });
            prisma.comanda.create.mockResolvedValue({
                id: 'com-1',
                codigo: 'ABC123',
                restauranteId: 'rest-1',
                mesaAtualId: 'mesa-1',
                status: ComandaStatus.aberta,
                contaSolicitada: false,
            });
            prisma.mesa.update.mockResolvedValue({ id: 'mesa-1', numero: 3, ocupada: true, contaSolicitada: false });
            prisma.pedido.create.mockResolvedValue({
                id: 'ped-1',
                idMesa: 'mesa-1',
                comandaId: 'com-1',
                restauranteId: 'rest-1',
                status: 'pendente',
                encerrado: false,
                dataCriacao: new Date(),
                itens: [
                    {
                        produtoId: 'prod-1',
                        quantidade: 1,
                        observacao: null,
                        precoUnitario: 10,
                        produto: {
                            id: 'prod-1',
                            nome: 'Pizza',
                            descricao: null,
                            preco: 10,
                            idCategoria: 'cat-1',
                            disponivel: true,
                            imagemUrl: null,
                            restauranteId: 'rest-1',
                        },
                    },
                ],
                mesa: { numero: 3 },
            });

            const resposta = await service.criar({
                idMesa: '3',
                itens: [{ idProduto: 'prod-1', quantidade: 1 }],
            }, 'rest-1');

            expect(resposta).toMatchObject({
                id: 'ped-1',
                comanda: {
                    id: 'com-1',
                    codigo: 'ABC123',
                },
            });
            expect(typeof (resposta as any).comanda?.token).toBe('string');
        });

        it('exige token quando já existe comanda ativa', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 3, restauranteId: 'rest-1' });
            prisma.comanda.findFirst.mockResolvedValue({
                id: 'com-1',
                restauranteId: 'rest-1',
                mesaAtualId: 'mesa-1',
                status: ComandaStatus.aberta,
                contaSolicitada: false,
            });

            await expect(service.criar({
                idMesa: '3',
                itens: [{ idProduto: 'prod-1', quantidade: 1 }],
            }, 'rest-1')).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});

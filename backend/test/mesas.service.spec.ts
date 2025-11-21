import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MesasService } from '../src/mesas/mesas.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';
import { criarPedidosGatewayMock, PedidosGatewayMock } from './mocks/pedidos-gateway.mock';

describe('MesasService', () => {
    let prisma: PrismaMock;
    let service: MesasService;
    let pedidosGateway: PedidosGatewayMock;
    const FRONTEND_URL_ORIGINAL = process.env.FRONTEND_URL;

    beforeEach(() => {
        prisma = criarPrismaMock();
        pedidosGateway = criarPedidosGatewayMock();
        service = new MesasService(prisma as any, pedidosGateway as any);
        process.env.FRONTEND_URL = '';
    });

    afterEach(() => {
        process.env.FRONTEND_URL = FRONTEND_URL_ORIGINAL;
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
            prisma.mesa.findFirst.mockResolvedValue({ id: 'mesa-1', numero: 10, ocupada: true, contaSolicitada: true });
            prisma.pedido.updateMany.mockResolvedValue({ count: 1 });
            prisma.mesa.update.mockResolvedValue({ id: 'mesa-1', numero: 10, ocupada: false, contaSolicitada: false });
            
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

    describe('adicionar (Segurança QR Code)', () => {
        it('prioriza FRONTEND_URL configurada, mesmo se receber base diferente', async () => {
            process.env.FRONTEND_URL = 'https://app.oficial.com';
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue(null);
            prisma.mesa.create.mockResolvedValue({ id: 'm1' });

            const urlMaliciosa = 'http://site-falso.com';
            
            await service.adicionar(1, urlMaliciosa, 'rest-1');

            // Verifica se o create foi chamado com a URL SEGURA
            expect(prisma.mesa.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        codigoQr: expect.stringContaining('https://app.oficial.com/mesa/1'),
                    })
                })
            );
        });

        it('usa base enviada quando FRONTEND_URL não está definida', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.mesa.findFirst.mockResolvedValue(null);
            prisma.mesa.create.mockResolvedValue({ id: 'm1' });

            await service.adicionar(2, 'https://minha-pagina.com/app', 'rest-1');

            expect(prisma.mesa.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        codigoQr: expect.stringContaining('https://minha-pagina.com/mesa/2'),
                    })
                })
            );
        });
    });

    describe('configurar (Segurança QR Code)', () => {
        it('usa FRONTEND_URL ao recriar mesas quando configurada', async () => {
            process.env.FRONTEND_URL = 'https://frente.oficial.app';
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.pedido.count.mockResolvedValue(0); // Sem pedidos ativos

            const urlMaliciosa = 'http://phishing.com';

            await service.configurar(5, urlMaliciosa, 'rest-1');

            expect(prisma.mesa.createMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            // Verifica se o item 1 tem a URL segura
                            codigoQr: expect.stringContaining('https://frente.oficial.app/mesa/1')
                        })
                    ])
                })
            );
        });

        it('usa base recebida quando FRONTEND_URL não está configurada', async () => {
            prisma.restaurante.findUnique.mockResolvedValue({ id: 'rest-1' });
            prisma.pedido.count.mockResolvedValue(0);

            await service.configurar(3, 'https://dominio-exemplo.com', 'rest-1');

            expect(prisma.mesa.createMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            codigoQr: expect.stringContaining('https://dominio-exemplo.com/mesa/1')
                        }),
                    ]),
                })
            );
        });
    });
});

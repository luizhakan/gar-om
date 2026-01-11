import { BadRequestException } from '@nestjs/common';
import { ComandaStatus, DispositivoStatus } from '@prisma/client';
import { ComandasService } from '../src/comandas/comandas.service';
import { criarPrismaMock, PrismaMock } from './mocks/prisma.mock';
import { criarPedidosGatewayMock, PedidosGatewayMock } from './mocks/pedidos-gateway.mock';

describe('ComandasService', () => {
    let prisma: PrismaMock;
    let service: ComandasService;
    let pedidosGateway: PedidosGatewayMock;

    beforeEach(() => {
        prisma = criarPrismaMock();
        pedidosGateway = criarPedidosGatewayMock();
        service = new ComandasService(prisma as any, pedidosGateway as any);
    });

    it('cria solicitação de acesso pendente com apelido limpo', async () => {
        prisma.comanda.findFirst.mockResolvedValue({
            id: 'com-1',
            codigo: 'ABC123',
            restauranteId: 'rest-1',
            status: ComandaStatus.aberta,
        });
        prisma.comandaDispositivo.create.mockResolvedValue({ id: 'disp-1' });

        const resposta = await service.solicitarAcesso('ABC123', 'rest-1', '  Celular  ');

        expect(resposta).toEqual({ idDispositivo: 'disp-1' });
        expect(prisma.comandaDispositivo.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                comandaId: 'com-1',
                apelido: 'Celular',
                status: DispositivoStatus.pendente,
                ativo: true,
            }),
        }));
    });

    it('consulta solicitação e retorna token quando aprovado sem hash', async () => {
        prisma.comandaDispositivo.findUnique.mockResolvedValue({
            id: 'disp-1',
            status: DispositivoStatus.aprovado,
            ativo: true,
            tokenHash: null,
            comandaId: 'com-1',
            comanda: {
                id: 'com-1',
                codigo: 'ABC123',
                restauranteId: 'rest-1',
                status: ComandaStatus.aberta,
            },
        });
        prisma.comandaDispositivo.update.mockResolvedValue({ id: 'disp-1' });

        const resposta = await service.consultarSolicitacao('disp-1', 'ABC123', 'rest-1');

        expect(resposta.status).toBe(DispositivoStatus.aprovado);
        expect(resposta.comandaId).toBe('com-1');
        expect(typeof resposta.token).toBe('string');
        expect(prisma.comandaDispositivo.update).toHaveBeenCalled();
    });

    it('bloqueia troca de mesa quando a conta já foi solicitada', async () => {
        prisma.comanda.findFirst.mockResolvedValue({
            id: 'com-1',
            restauranteId: 'rest-1',
            status: ComandaStatus.aberta,
            contaSolicitada: true,
            mesaAtualId: 'mesa-1',
            mesaAtual: { id: 'mesa-1', numero: 3 },
        });
        prisma.comandaDispositivo.findFirst.mockResolvedValue({
            id: 'disp-1',
            comandaId: 'com-1',
            master: true,
            status: DispositivoStatus.aprovado,
            ativo: true,
        });

        await expect(service.trocarMesa('com-1', 'rest-1', 4, 'token-test')).rejects.toBeInstanceOf(BadRequestException);
    });
});

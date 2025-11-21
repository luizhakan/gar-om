export type PedidosGatewayMock = {
    emitirNovoPedido: jest.Mock;
    emitirAtualizacaoPedido: jest.Mock;
    emitirAtualizacaoMesa: jest.Mock;
};

export function criarPedidosGatewayMock(): PedidosGatewayMock {
    return {
        emitirNovoPedido: jest.fn(),
        emitirAtualizacaoPedido: jest.fn(),
        emitirAtualizacaoMesa: jest.fn(),
    };
}

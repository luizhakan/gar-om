// backend/src/pedidos/pedidos.module.ts
import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PedidosGateway } from './pedidos.gateway'; // <-- Adicionar

@Module({
    controllers: [PedidosController],
    providers: [PedidosService, PedidosGateway], // <-- Adicionar Gateway
    exports: [PedidosService, PedidosGateway], // Exportar para uso em outros módulos (ex: MesasModule)
})
export class PedidosModule {}
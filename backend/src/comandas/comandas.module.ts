import { Module } from '@nestjs/common';
import { ComandasController } from './comandas.controller';
import { ComandasService } from './comandas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
    imports: [PrismaModule, PedidosModule],
    controllers: [ComandasController],
    providers: [ComandasService],
    exports: [ComandasService],
})
export class ComandasModule {}

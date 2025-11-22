import { Module } from '@nestjs/common';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { MercadoPagoService } from './mercado-pago.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PagamentosController, WebhooksController],
    providers: [PagamentosService, MercadoPagoService],
    exports: [PagamentosService],
})
export class PagamentosModule {}

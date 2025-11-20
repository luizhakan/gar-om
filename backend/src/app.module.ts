import { Module } from '@nestjs/common';
import { ProdutosModule } from './produtos/produtos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MesasModule } from './mesas/mesas.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        ProdutosModule,
        CategoriasModule,
        MesasModule,
        PedidosModule,
    ],
})
export class AppModule {}

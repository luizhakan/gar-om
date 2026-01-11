import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler'; // 1. Importar
import { ProdutosModule } from './produtos/produtos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { MesasModule } from './mesas/mesas.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ComandasModule } from './comandas/comandas.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MasterModule } from './master/master.module';
import { PagamentosModule } from './pagamentos/pagamentos.module';

@Module({
    imports: [
        // 2. Configuração base: Permite 100 requisições por minuto por IP (default generoso)
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        PrismaModule,
        AuthModule,
        MasterModule,
        ProdutosModule,
        CategoriasModule,
        MesasModule,
        PedidosModule,
        ComandasModule,
        PagamentosModule,
    ],
})
export class AppModule {}

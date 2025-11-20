# Código-fonte (`src/`)

Aqui vivem todos os módulos da API NestJS. Cada domínio possui sua própria pasta com `module`, `controller`, `service` e `dto` seguindo o padrão oficial do Nest.

## Regras de organização
- **Controllers** são finos: recebem DTOs validados e delegam 100% para os Services.
- **Services** concentram a regra de negócio e acessos ao banco via `PrismaService` (injeção de dependência, nada de `new PrismaClient()`).
- **DTOs** usam `class-validator`/`class-transformer` e ficam dentro de cada módulo em `dto/`.
- Mantemos nomes e mensagens em PT-BR para alinhar com o frontend.

## Exemplo rápido de módulo

```typescript
import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';

@Module({
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
```

Use `AppModule` (`src/app.module.ts`) apenas para importar os módulos de domínio e o `PrismaModule` global.

# Prisma Module (Injeção do Client)

Módulo global que expõe o `PrismaService` para todos os outros serviços. Ele cuida do ciclo de vida do `PrismaClient` (`$connect`/`$disconnect`) e evita duplicação de conexões.

## Como usar
```typescript
// Em qualquer service
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.produto.findMany();
  }
}
```

## Regras
- Nunca instancie `new PrismaClient()` fora deste módulo. Sempre injete `PrismaService`.
- Para testes automatizados, **mockamos** o `PrismaService` (veja os arquivos em `test/`); não usamos banco real nos testes.

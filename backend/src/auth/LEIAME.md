# Auth (Admin e Cozinha)

Gerencia cadastro/login do administrador e login dos usuários da cozinha. Usa `bcryptjs` para hash de senha e valida CPF pelo algoritmo oficial.

## Fluxos
- `POST /auth/admin/register`: cria restaurante + admin vinculado (CPF higienizado para números).
- `POST /auth/admin/login`: autentica admin e retorna payload básico (id/nome/email/restauranteId).
- `POST /auth/cozinha/login`: autentica usuário da cozinha e retorna id/email/restauranteId.

## Regras
- Validação de entrada via DTOs (`login.dto.ts`, `admin-register.dto.ts`).
- Hash de senha sempre feito no `AuthService` (`bcrypt.hash`), compare via `bcrypt.compare`.
- Não há JWT aqui; controllers devolvem apenas payload mínimo. Adapte aqui caso um token seja necessário.

## Exemplo de código
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async loginAdmin(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (!admin) throw new UnauthorizedException('Admin não encontrado');

    const ok = await bcrypt.compare(dto.senha, admin.senhaHash);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    return { admin: { id: admin.id, nome: admin.nome, email: admin.email, restauranteId: admin.restauranteId } };
  }
}
```

# DTOs de Autenticação

DTOs usados nos controllers de Auth. Toda entrada passa pelo `ValidationPipe` global antes de chegar ao service.

## Arquivos
- `login.dto.ts`: email + senha com `@IsEmail` e `@MinLength(6)`.
- `admin-register.dto.ts`: nome, email, CPF e senha (+ função `cpfValidoOuErro` que usa `cpf.util.ts`).

## Exemplo
```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { cpfValidoOuErro } from './admin-register.dto';

export class AdminRegisterDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  cpf: string;

  @IsString()
  @MinLength(6)
  senha: string;
}

// Use cpfValidoOuErro(dto.cpf) no service antes de gravar
```

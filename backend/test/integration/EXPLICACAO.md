# Por que o erro de Foreign Key não foi pego nos testes?

## O Problema Original

Erro ao tentar reconfigurar mesas quando existem pedidos associados:
```
Foreign key constraint violated on the constraint: `Pedido_idMesa_fkey`
```

## Por que os testes não pegaram?

### Testes Unitários (antes)
- Usavam **mocks do Prisma** (`criarPrismaMock()`)
- Mocks retornam valores fictícios, não executam queries reais
- **Não validam constraints do banco** (foreign keys, unique, check, etc.)
- Úteis para lógica de negócio, mas não pegam erros de banco

### Solução: Testes de Integração

Agora temos **dois tipos de testes**:

#### 1. Testes Unitários (`test/*.spec.ts`)
- Continuam usando mocks
- Rápidos e isolados
- Testam lógica de negócio
- Rodar: `npm run test:unit`

#### 2. Testes de Integração (`test/integration/*.spec.ts`)
- Usam **banco PostgreSQL real** (porta 5433)
- Validam constraints do banco
- Pegam erros de foreign key, unique, etc.
- Rodar: `npm run test:integration`

## O que foi implementado

### 1. Container Docker separado para testes
```yaml
# docker-compose.yml
db-test:
  image: postgres:16-alpine
  container_name: garcom-db-test
  ports:
    - "5433:5432"  # Porta diferente do banco principal
  tmpfs:
    - /var/lib/postgresql/data  # Dados não são persistidos
```

### 2. Arquivo .env.test
```env
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public"
```

### 3. Testes de integração para MesasService
- Testa o fluxo completo com banco real
- **Inclui teste que detecta o erro de foreign key**:
```typescript
it('DEVE FALHAR: deleta mesas mesmo com pedidos associados', async () => {
    // Cria mesa com pedido
    await prisma.mesa.create({ ... });
    await prisma.pedido.create({ idMesa: 'mesa-1', ... });
    
    // Tenta reconfigurar - deve falhar com erro de foreign key
    await expect(service.configurar(3, 'http://app.test', restauranteId))
        .rejects
        .toThrow(/Foreign key constraint|Pedido_idMesa_fkey/);
});
```

### 4. Scripts npm atualizados
```json
{
  "test": "jest --runInBand",                    // Todos os testes
  "test:unit": "jest --testPathIgnorePatterns=integration",  // Só unitários
  "test:integration": "NODE_ENV=test jest --testPathPattern=integration"  // Só integração
}
```

## Como usar

### Setup inicial
```bash
# Iniciar banco de testes
docker-compose up -d db-test

# Rodar migrations
DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public" npx prisma migrate deploy
```

### Rodando testes
```bash
# Testes unitários (rápidos, sem banco)
npm run test:unit

# Testes de integração (com banco real)
npm run test:integration

# Todos
npm test
```

## Resultado

✅ **Agora os testes pegam erros de foreign key constraint**
✅ Temos testes rápidos (unitários) e completos (integração)
✅ Banco de testes isolado não afeta dados de desenvolvimento
✅ Dados do banco de testes não são persistidos (tmpfs)

# ✅ CORREÇÃO: Pagamento de Assinatura do Restaurante

## 🎯 O que foi corrigido

O módulo de pagamentos estava implementado **INCORRETAMENTE** para pagamentos de pedidos dos clientes. 

**Contexto correto**: O pagamento é para a **assinatura do restaurante** no sistema Garçom, não para os clientes pagarem suas contas.

---

## 🔄 Mudanças Realizadas

### ❌ REMOVIDO (Frontend - Incorreto)
- `/frontend/src/pages/Cliente/Pagamento.tsx` - Página de pagamento do cliente
- `/frontend/src/pages/Cliente/Pagamento.css` - Estilos
- `/frontend/src/services/ServicoPagamentos.ts` - Serviço de API
- Rota `/mesa/:idMesa/pagamento` 
- Botão "💳 Pagar Agora" no RevisarPedido

### ✅ AJUSTADO (Backend - Correto)

#### 1. Schema Prisma (`prisma/schema.prisma`)
**Antes**:
```prisma
model Pagamento {
  pedidoId      String  @unique  // ❌ Vinculado a pedido do cliente
  ...
}
```

**Depois**:
```prisma
model Pagamento {
  restauranteId       String           // ✅ Vinculado ao restaurante
  planDurationMonths  Int @default(1)  // ✅ Duração do plano
  // Removido: pedidoId
  ...
}
```

#### 2. DTO (`dto/create-payment.dto.ts`)
**Antes**:
```typescript
export class CreatePaymentDto {
  @IsString()
  pedidoId!: string;  // ❌ ID do pedido
  ...
}
```

**Depois**:
```typescript
export class CreatePaymentDto {
  planDurationMonths?: number;  // ✅ Meses de assinatura
  // Removido: pedidoId
  ...
}
```

#### 3. Service (`pagamentos.service.ts`)
**Antes**:
```typescript
async createPayment(...) {
  // Validava pedido
  const pedido = await prisma.pedido.findFirst(...);
  const total = pedido.itens.reduce(...);  // ❌
}
```

**Depois**:
```typescript
async createPayment(...) {
  // Valida restaurante
  const restaurante = await prisma.restaurante.findUnique(...);
  
  // Se aprovado, renova assinatura
  if (status === 'approved') {
    await this.updateRestauranteSubscription(restauranteId, months);
  }
}

// ✅ NOVO método
private async updateRestauranteSubscription(restauranteId, months) {
  await prisma.restaurante.update({
    data: {
      subscriptionStatus: 'active',
      trialEndsAt: new Date(+months),
      blockedAt: null
    }
  });
}
```

#### 4. Documentação (`README.md`)
- ✅ Nova documentação explicando contexto correto
- ✅ Exemplo de uso para assinatura
- ✅ Fluxo de renovação automática
- ✅ Checklist de implementação

---

## 🗃️ Migração Aplicada

**Arquivo**: `20251122173102_pagamento_assinatura_restaurante`

```sql
-- Remover relação com Pedido
ALTER TABLE "Pagamento" DROP COLUMN "pedidoId";

-- Adicionar campo de duração do plano
ALTER TABLE "Pagamento" ADD COLUMN "planDurationMonths" INTEGER DEFAULT 1;
```

---

## 📊 Fluxo Correto

```
┌─────────────────────────────────────────────────┐
│  1. Trial do restaurante expira                 │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  2. Admin vê aviso no dashboard                 │
│     "Sua assinatura expirou"                    │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  3. Admin clica "Renovar Assinatura"            │
│     - Página /admin/assinatura                  │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  4. CardForm do Mercado Pago                    │
│     - Preenche dados do cartão                  │
│     - SDK gera token seguro                     │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  5. POST /pagamentos                            │
│     {                                           │
│       transaction_amount: 49.90,                │
│       token: "xxx",                             │
│       planDurationMonths: 1,                    │
│       ...                                       │
│     }                                           │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  6. Backend processa no Mercado Pago            │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  7. Pagamento aprovado                          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  8. Backend atualiza restaurante:               │
│     - subscriptionStatus = 'active'             │
│     - trialEndsAt = +30 dias                    │
│     - blockedAt = null                          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  9. Restaurante volta a funcionar               │
│     ✅ Sistema liberado por mais 30 dias        │
└─────────────────────────────────────────────────┘
```

---

## 📝 Próximos Passos

### Frontend (Ainda não implementado)

Criar página de assinatura para o **Admin**:

```
/frontend/src/pages/Admin/Assinatura.tsx
```

Esta página deve:
- Mostrar status atual (trial, ativo, vencido)
- Mostrar data de vencimento
- Botão "Renovar Assinatura"
- Usar CardPayment do @mercadopago/sdk-react
- Chamar POST /pagamentos

### Exemplo de código:

```tsx
// src/pages/Admin/Assinatura.tsx
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('PUBLIC_KEY');

export function Assinatura() {
  const restaurante = useRestaurante(); // hook com dados do restaurante
  
  const handleSubmit = async (formData: any) => {
    const response = await api.post('/pagamentos', {
      transaction_amount: 49.90,
      token: formData.token,
      payment_method_id: formData.payment_method_id,
      installments: formData.installments,
      planDurationMonths: 1,
      payer: {
        email: formData.payer.email,
        identification: formData.payer.identification,
      },
    });
    
    if (response.data.status === 'approved') {
      alert('✅ Assinatura renovada com sucesso!');
      window.location.reload();
    } else {
      alert('❌ Pagamento recusado. Tente outro cartão.');
    }
  };

  return (
    <div>
      <h1>Gerenciar Assinatura</h1>
      
      <div className="status">
        <p>Status: {restaurante.subscriptionStatus}</p>
        <p>Válido até: {formatDate(restaurante.trialEndsAt)}</p>
      </div>

      {restaurante.subscriptionStatus !== 'active' && (
        <CardPayment
          initialization={{ amount: 49.90 }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
```

---

## 🧪 Testar

### 1. Backend está pronto
```bash
cd backend
npm run start:dev
```

### 2. Endpoint disponível
```bash
curl -X POST http://localhost:3001/pagamentos \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_amount": 49.90,
    "token": "test_card_token",
    "payment_method_id": "visa",
    "installments": 1,
    "planDurationMonths": 1,
    "payer": {
      "email": "test@test.com"
    }
  }'
```

### 3. Frontend precisa ser implementado
- Criar página Admin/Assinatura.tsx
- Instalar @mercadopago/sdk-react (já está instalado)
- Adicionar rota /admin/assinatura
- Implementar CardPayment

---

## 📚 Documentação Completa

Leia: `/backend/src/pagamentos/README.md`

---

**Data da correção**: 22/11/2024
**Status**: ✅ Backend corrigido | ⏳ Frontend pendente

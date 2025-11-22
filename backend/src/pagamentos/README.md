# 💳 Pagamentos de Assinatura - Mercado Pago

## ⚠️ CONTEXTO IMPORTANTE

**Este módulo gerencia pagamentos de ASSINATURA DO RESTAURANTE, NÃO pagamentos de pedidos dos clientes!**

O sistema Garçom funciona com:
- **Trial gratuito**: 14-30 dias de teste
- **Assinatura paga**: Após o trial, o restaurante paga mensalmente/anualmente para continuar usando

Este módulo processa esses pagamentos de assinatura.

## 🎯 Objetivo

Integração com Mercado Pago para processar pagamentos recorrentes da assinatura do sistema.

## 📋 Funcionalidades

- ✅ Processamento de pagamentos via cartão de crédito
- ✅ Renovação automática da assinatura após aprovação
- ✅ Atualização do período de trial/assinatura
- ✅ Webhooks para notificações em tempo real
- ✅ Validação HMAC SHA256 dos webhooks
- ✅ Chaves de idempotência (evita cobranças duplicadas)
- ✅ Histórico completo de pagamentos e eventos

## 🗂️ Estrutura do Banco de Dados

### Model `Pagamento`
```prisma
model Pagamento {
  id                   String         @id @default(uuid())
  restauranteId        String
  mercadoPagoId        String?        @unique
  status               PaymentStatus  @default(pending)
  statusDetail         String?
  transactionAmount    Float          // Valor da assinatura
  paymentMethodId      String?
  installments         Int?
  description          String?        // "Assinatura Mensal - Garçom"
  payerEmail           String?
  payerIdentification  Json?
  planDurationMonths   Int            @default(1)
  createdAt            DateTime       @default(now())
  restaurante          Restaurante    @relation(...)
}
```

### Model `Restaurante`
```prisma
model Restaurante {
  trialStartedAt      DateTime
  trialEndsAt         DateTime
  subscriptionStatus  SubscriptionStatus  // trialing, active, past_due, canceled, blocked
  blockedAt           DateTime?
  pagamentos          Pagamento[]
}
```

## 🚀 Como Usar

### 1. Criar Pagamento de Assinatura

**Endpoint**: `POST /pagamentos`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "transaction_amount": 49.90,
  "token": "card_token_from_frontend",
  "description": "Assinatura Mensal - Garçom",
  "installments": 1,
  "payment_method_id": "visa",
  "planDurationMonths": 1,
  "payer": {
    "email": "restaurante@email.com",
    "identification": {
      "type": "CNPJ",
      "number": "12345678000190"
    }
  }
}
```

**Resposta (201)**:
```json
{
  "id": "uuid",
  "restauranteId": "uuid",
  "status": "approved",
  "transactionAmount": 49.90,
  "planDurationMonths": 1,
  "createdAt": "2024-11-22T...",
  "mercadoPagoData": { ... }
}
```

### 2. Consultar Pagamento

**Endpoint**: `GET /pagamentos/:id`

### 3. Webhook (Notificações)

**Endpoint**: `POST /webhooks/mercadopago`

Recebe notificações automáticas do Mercado Pago quando:
- Pagamento é aprovado
- Pagamento é recusado
- Status muda (ex: contestação)

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_WEBHOOK_SECRET=xxx
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/webhooks/mercadopago

# API Base
API_BASE_URL=https://seu-dominio.com
```

### Obter Credenciais

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie uma aplicação
3. Copie `Access Token` e `Public Key`
4. Configure webhook URL no painel

## 🔒 Segurança

### Tokenização de Cartão
O cartão NUNCA chega no backend. O frontend usa o SDK do Mercado Pago para gerar um token seguro.

### Validação de Webhook
Todos os webhooks são validados com HMAC SHA256:

```typescript
const signature = req.headers['x-signature'];
const requestId = req.headers['x-request-id'];

// Valida assinatura
const isValid = mercadoPagoService.validateWebhookSignature(
  webhookData,
  signature,
  requestId
);
```

### Idempotência
Cada pagamento tem uma chave única (`idempotencyKey`). Se ocorrer retry/duplicação, o Mercado Pago usa a mesma transação.

## 📊 Fluxo de Pagamento

```
1. Trial expira → Admin vê aviso no dashboard
2. Admin clica "Renovar Assinatura"
3. Frontend carrega CardForm do Mercado Pago
4. Cliente preenche dados do cartão
5. SDK gera token seguro
6. Frontend envia: POST /pagamentos { token, amount, ... }
7. Backend cria pagamento no Mercado Pago
8. Mercado Pago processa
9. Webhook notifica resultado
10. Backend atualiza:
    - status do pagamento
    - trialEndsAt do restaurante (+30 dias)
    - subscriptionStatus = 'active'
11. Restaurante continua operando normalmente
```

## 🧪 Testar com Cartões de Teste

### Cartões Aprovados
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO
```

### Cartões Recusados
```
Número: 5031 4332 1540 6351
Nome: OTHE (outros erros)
```

Mais cartões: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## 📝 Status de Pagamento

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando processamento |
| `approved` | ✅ Aprovado (renova assinatura) |
| `in_process` | Em análise |
| `rejected` | ❌ Recusado |
| `cancelled` | Cancelado |
| `refunded` | Estornado |

## 🔄 Renovação Automática

Quando um pagamento é aprovado:

```typescript
// Backend automaticamente atualiza:
await prisma.restaurante.update({
  where: { id: restauranteId },
  data: {
    subscriptionStatus: 'active',
    trialEndsAt: new Date(+30 dias),
    blockedAt: null
  }
});
```

## 🚨 Tratamento de Erros

### Pagamento Recusado
- Status: `rejected`
- Cliente pode tentar outro cartão
- Restaurante continua bloqueado

### Webhook Falhou
- Eventos são salvos mesmo se processamento falhar
- Possível reprocessar manualmente
- Logs completos para debug

## 📞 Suporte

- Docs Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Status API: https://status.mercadopago.com/
- Suporte: https://www.mercadopago.com.br/developers/pt/support

## 🎨 Frontend (Admin)

O admin vê:
- Status da assinatura (trial, ativa, vencida)
- Data de vencimento
- Botão "Renovar Assinatura" quando necessário
- Histórico de pagamentos

Exemplo de componente:
```tsx
// src/pages/Admin/Assinatura.tsx
import { CardPayment } from '@mercadopago/sdk-react';

function Assinatura() {
  const handleSubmit = async (formData) => {
    const response = await api.post('/pagamentos', {
      transaction_amount: 49.90,
      token: formData.token,
      payment_method_id: formData.payment_method_id,
      installments: formData.installments,
      planDurationMonths: 1,
      payer: formData.payer,
    });
    
    if (response.status === 'approved') {
      alert('Pagamento aprovado! Assinatura renovada.');
    }
  };

  return (
    <CardPayment
      initialization={{ amount: 49.90 }}
      onSubmit={handleSubmit}
    />
  );
}
```

## ✅ Checklist de Implementação

- [x] Modelo Prisma criado
- [x] Migração aplicada
- [x] Service implementado
- [x] Controller criado
- [x] DTOs validados
- [x] Webhook configurado
- [x] Segurança implementada (HMAC)
- [x] Idempotência configurada
- [x] Renovação automática
- [ ] Frontend admin implementado
- [ ] Testes de integração
- [ ] Deploy webhook URL
- [ ] Configurar production keys

---

**Última atualização**: 22/11/2024

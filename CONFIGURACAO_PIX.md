# Configuração de Pagamento via PIX e Checkout Mercado Pago

## ✅ Implementação Concluída

O sistema agora suporta pagamento via **PIX, Boleto Bancário e Cartão de Crédito** através do checkout do Mercado Pago!

## 🎯 O que foi implementado

### Backend

1. **Novo método no `MercadoPagoService`**:
   - `createPreference()` - Cria uma preference de checkout que aceita múltiplos meios de pagamento

2. **Novo método no `PagamentosService`**:
   - `createCheckoutPreference()` - Cria checkout com valores baseados na duração do plano

3. **Novo endpoint**:
   - `POST /pagamentos/checkout` - Cria preference e retorna URL do checkout

4. **Webhook melhorado**:
   - Agora cria automaticamente registros de pagamento quando recebe notificações do checkout
   - Processa pagamentos PIX, boleto e cartão
   - Atualiza automaticamente a assinatura quando o pagamento é aprovado

### Frontend

1. **Página de Assinatura Atualizada**:
   - Removido formulário de cartão (CardPayment)
   - Adicionado botões para planos: Mensal, Trimestral e Anual
   - Redirecionamento automático para checkout do Mercado Pago
   - Tratamento de retorno com status de pagamento (success, failure, pending)

2. **Novo serviço**:
   - `ServicoPagamentos.criarCheckout()` - Chama endpoint de criação do checkout

## 🔧 Variáveis de Ambiente Necessárias

### Backend (.env)

```bash
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_SECRET=d018c4f********************************************************* (veja abaixo)

# URLs
API_BASE_URL=https://seu-dominio.com/api
FRONTEND_URL=https://seu-dominio.com
```

### Frontend (.env)

```bash
# Não precisa mais da chave pública do Mercado Pago!
# O checkout é feito via redirect para o Mercado Pago
```

## 🔐 Secret Key do Webhook

A secret key do webhook foi configurada e está disponível no painel do desenvolvedor do Mercado Pago:
```
d018c4f*********************************************************
```

Para ver a chave completa:
1. Acesse https://www.mercadopago.com.br/developers/panel/app/2988290541936830/webhooks
2. Copie a secret key completa
3. Configure no arquivo `.env` do backend na variável `MERCADO_PAGO_WEBHOOK_SECRET`

## 🌐 Webhooks Configurados

### URLs:
- **Produção**: `https://garcomagil.com/api/webhooks/mercadopago`
- **Sandbox/Teste**: `https://e7d4d30dd816.ngrok-free.app/webhooks/mercadopago`

### Tópicos Inscritos:
- `payment` - Notificações de pagamento (PIX, boleto, cartão)
- `subscription_authorized_payment` - Pagamentos de assinatura autorizados
- `subscription_preapproval` - Mudanças em assinaturas
- `subscription_preapproval_plan` - Mudanças em planos de assinatura

## 💰 Planos Disponíveis

| Plano | Duração | Valor Total | Valor/Mês | Economia |
|-------|---------|-------------|-----------|----------|
| Mensal | 1 mês | R$ 50,00 | R$ 50,00 | - |
| Trimestral | 3 meses | R$ 135,00 | R$ 45,00 | 10% |
| Anual | 12 meses | R$ 480,00 | R$ 40,00 | 20% |

## 🚀 Como Funciona

### Fluxo de Pagamento:

1. **Usuário clica em "Pagar com PIX, Boleto ou Cartão"**
2. **Backend cria uma preference no Mercado Pago** com:
   - Valor do plano
   - Informações do restaurante
   - URL de notificação (webhook)
   - URLs de retorno (success, failure, pending)
3. **Frontend redireciona para o checkout do Mercado Pago**
4. **Usuário escolhe forma de pagamento** (PIX, boleto ou cartão)
5. **Mercado Pago processa o pagamento**
6. **Webhook notifica o backend** sobre o status do pagamento
7. **Backend atualiza automaticamente a assinatura** se aprovado
8. **Usuário é redirecionado de volta** com mensagem de sucesso/erro

### Tratamento de Webhook:

```typescript
// O webhook agora:
1. Recebe notificação do Mercado Pago
2. Busca informações atualizadas do pagamento
3. Se não existe registro, cria automaticamente
4. Atualiza o status do pagamento
5. Se aprovado, renova a assinatura do restaurante
6. Registra o evento para auditoria
```

## 🧪 Testando

### Testar PIX (Sandbox):

1. Faça login como admin
2. Acesse `/admin/assinatura`
3. Clique em "Pagar com PIX, Boleto ou Cartão"
4. Escolha PIX
5. Use o QR Code de teste do Mercado Pago

### Testar Webhook Localmente:

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - ngrok (para expor localhost)
ngrok http 3000

# Copie a URL do ngrok e atualize:
# - MERCADO_PAGO_WEBHOOK_URL no .env
# - Webhook URL no painel do Mercado Pago
```

### Simular Webhook:

Você pode usar a ferramenta MCP para simular um webhook:
```typescript
// Isso enviará uma notificação de teste para seu endpoint
mcp_mercadopago-m_simulate_webhook({
  resource_id: "1234567890", // ID do pagamento
  topic: "payment",
  callback_env_production: false // usa sandbox
})
```

## 📊 Monitoramento

### Histórico de Webhooks:

Use a ferramenta para ver o histórico:
```bash
# Verifica histórico de notificações
mcp_mercadopago-m_notifications_history
```

Atualmente:
- ✅ **1 webhook bem-sucedido** (11.1% de sucesso)
- ❌ **8 webhooks falharam** (502, 404)
- **Média de processamento**: 609ms

### Melhorias Recomendadas:

1. **Implementar retry mechanism** para webhooks que falharam
2. **Adicionar logs mais detalhados** para debug
3. **Implementar validação de assinatura** em produção (atualmente desabilitada)
4. **Configurar alertas** para falhas de webhook

## 🔒 Segurança

### Validação de Assinatura (Desabilitada):

No arquivo `webhooks.controller.ts`, a validação de assinatura está comentada:

```typescript
// if (process.env.NODE_ENV === 'production') {
//     const isValid = this.mercadoPagoService.validateWebhookSignature(
//         xSignature,
//         xRequestId,
//         dataId,
//     );
//
//     if (!isValid) {
//         throw new BadRequestException('Assinatura inválida');
//     }
// }
```

**Recomendação**: Habilitar em produção após configurar `MERCADO_PAGO_WEBHOOK_SECRET`

## 📝 Próximos Passos

1. ✅ Implementar pagamento via PIX/Checkout
2. ✅ Configurar webhooks
3. ✅ Criar preference de checkout
4. ✅ Atualizar frontend
5. 🔄 Testar em ambiente de produção
6. 🔄 Habilitar validação de assinatura
7. 🔄 Implementar retry de webhooks
8. 🔄 Adicionar notificações por email

## 🐛 Solução de Problemas

### Webhook retornando 502:
- Verifique se o backend está rodando
- Confirme se a URL está acessível publicamente
- Verifique logs do servidor

### Webhook retornando 404:
- Confirme que a rota `/webhooks/mercadopago` existe
- Verifique se o controller está registrado no módulo

### Pagamento não atualiza assinatura:
- Verifique logs do webhook
- Confirme que o `external_reference` está no formato correto
- Verifique se o restauranteId é válido

## 📚 Documentação Adicional

- [Mercado Pago - Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [Mercado Pago - Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Mercado Pago - Preferences](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)

# 🚀 Plano Fundador — Especificação Técnica e de Negócio

> Campanha de aquisição do **Garçom Ágil**: assinatura anual com super desconto para os **10 primeiros** lojistas, oferecida **apenas durante o trial**, criando dupla urgência (tempo + escassez).

Documento de planejamento — descreve o desenho acordado. **Implementado em 2026-06-19.**

---

## 1. Regras de negócio

| Item | Regra |
|---|---|
| **Trial** | 7 dias ao criar a conta (hoje são 14) |
| **Pós-trial** | Precisa assinar **qualquer** plano para continuar usando |
| **Tempo cumulativo** | Pagar **soma** ao tempo restante, não zera. Ex: 3 dias de trial + plano mensal = 33 dias |
| **Plano Fundador** | R$ 500,00/ano, **só na adesão**, **só durante o trial ativo** |
| **Cap da campanha** | No máximo **10 fundadores no total, para sempre** (independente do tempo) |
| **Renovação / planos normais** | Anual R$ 960 / Trimestral R$ 270 / Mensal R$ 100 |
| **Recebimento** | Pagamento avulso via Checkout Pro do Mercado Pago — o dinheiro cai na hora (sem recorrência/preapproval) |

### Elegibilidade ao Plano Fundador

O fundador só é oferecido a um restaurante quando **todas** estas condições forem verdadeiras:

```
subscriptionStatus == 'trialing'
E  trialEndsAt > agora            (trial ainda não expirou)
E  foundingMemberAt == null       (este restaurante nunca foi fundador)
E  count(fundadores) < 10         (ainda há vaga global)
```

### Por que essas travas bastam

- **`foundingMemberAt == null` (por usuário):** impede oferecer o fundador duas vezes ao mesmo restaurante. Quando o ano fundador dele acaba e ele vai renovar, o campo já está preenchido → ele só vê os planos normais.
- **`count < 10` (global e monotônico):** `count` conta os restaurantes com `foundingMemberAt != null`. Esse campo **nunca é desfeito**, então a contagem só cresce. Ao bater 10, a condição vira `false` para sempre — a campanha **nunca relança**, sem precisar de nenhuma flag de "campanha encerrada".
- **`trialing` + `trialEndsAt > agora` (janela):** amarra o fundador ao trial. Expirou o trial → fundador some para aquele lojista. Isso gera a urgência de fechar o ano cheio com desconto o quanto antes.

> ⚠️ **Consequência intencional:** se o lojista comprar **outro** plano durante o trial (ex: mensal para acumular), ele vira `active`, sai de `trialing` e **perde o acesso ao fundador** — mesmo que ainda houvesse dias de trial e vagas. É desejado: evita "manobras" para empilhar fundador depois.

---

## 2. Estado atual da codebase (ponto de partida)

- **Não existe assinatura recorrente de verdade.** Apesar do nome, o fluxo usa `createPreference` (Checkout Pro) ou cartão direto — é **pagamento avulso**. Quando aprova, o webhook só estende o `trialEndsAt`. ✅ O dinheiro já cai na hora.
- **Preço hardcoded** em `createCheckoutPreference` (`backend/src/pagamentos/pagamentos.service.ts:120`): R$ 100/mês base, −10% trimestral, −20% anual (R$ 960). O frontend repete isso em `Assinatura.tsx`.
- **Conta nova** (`backend/src/auth/auth.service.ts:95`) nasce `trialing` + 14 dias (`TRIAL_DIAS = 14`).
- **Gate de acesso** (`backend/src/auth/subscription.guard.ts`) libera só `trialing` (não expirado) e `active`. Rotas de pagamento têm `@SkipSubscriptionCheck()`, então mesmo bloqueado o lojista consegue pagar.
- **Não há marca de "já usou preço promocional"** no model `Restaurante`. Os campos `mercadoPagoSubscriptionId` / `mercadoPagoCustomerId` existem mas não são usados.

---

## 3. Mudanças necessárias

### 3.1 Banco — `backend/prisma/schema.prisma` (model `Restaurante`)

```prisma
foundingMemberAt  DateTime?   // null = nunca foi fundador; setado na aprovação do pagamento fundador
foundingNumber    Int?        // opcional: "Fundador #3", útil para marketing
```

- Criar migration nova.
- O **cap de 10** é derivado de `count(where foundingMemberAt != null)`, não de um contador separado (evita dessincronização).

### 3.2 Catálogo de planos server-side (novo, ex: `backend/src/pagamentos/planos.ts`)

- Mapa `planCode → { durationMonths, priceCents, label }` com: `mensal`, `trimestral`, `anual`, `founder`.
- Função `precoEElegibilidade(planCode, restaurante)`:
  - Para `founder`: só retorna o preço (R$ 500) se a elegibilidade da seção 1 passar; senão recusa.
  - Para os demais: retorna preço fixo do catálogo.
- **Fonte única da verdade do preço** — nunca confiar em valor vindo do cliente.

### 3.3 `backend/src/pagamentos/pagamentos.service.ts`

- **`createCheckoutPreference`:** receber `planCode` (em vez de `planDurationMonths`), calcular o preço **no backend** pelo catálogo e validar a vaga de fundador no ato. Codificar no `external_reference`: `sub-{restauranteId}-{planCode}-{ts}`.
- **`updateRestauranteSubscription`:** trocar `now + duração` por **`max(now, trialEndsAt) + duração`** (cumulativo). Se `planCode === 'founder'`: setar `foundingMemberAt = now`, `foundingNumber` e `planLabel = 'Fundador'`.
- **`processWebhook`:** hoje cria pagamento "órfão" com `planDurationMonths: 1` fixo e o regex só extrai o `restauranteId` — precisa **extrair também o `planCode`** do `external_reference` para a duração e o cumulativo funcionarem via webhook. **Revalidar `count < 10` aqui** (consumo da vaga acontece na aprovação, não na exibição).
- **Novo endpoint** `vagasFundador()` → `{ elegivel: boolean, vagasRestantes: number }` para a UI.

### 3.4 `backend/src/auth/auth.service.ts`

- `TRIAL_DIAS = 14 → 7`. Resto do registro permanece igual.

### 3.5 Frontend — `frontend/src/pages/Admin/Assinatura.tsx`

- Buscar elegibilidade/vagas e exibir o **card Fundador em destaque quando elegível** ("restam X de 10 vagas").
- **Mostrar os planos durante o trial também** — hoje o bloco de planos só aparece quando `assinaturaInativa` (`Assinatura.tsx:164`). Como o lojista pode comprar durante o trial para acumular, é preciso exibir mesmo em `trialing`.
- Trocar as chamadas `abrirCheckout(1|3|12)` por `planCode`.

---

## 4. Pontos de atenção

- **🔓 Brecha de segurança:** a rota `POST /pagamentos` (cartão direto) confia no `transaction_amount` enviado pelo cliente (`create-payment.dto.ts:33`). Um cliente pode pagar R$ 1 e ativar. Recomendado: puxar o preço do catálogo nessa rota também, ou desativá-la e usar só o checkout.
- **🏁 Corrida nas vagas:** validar `count < 10` na **aprovação do pagamento** (webhook), não só na exibição. Se 12 lojistas em trial estiverem com a tela aberta com `count = 8`, todos acham que dá — e você poderia passar de 10.
- **🛡️ Anti-abuso:** `Admin.cpf` é único; dá para bloquear recriar conta para burlar trial/fundador, mas só dentro do mesmo CPF/CNPJ.
- **⏱️ Janela curta:** 7 dias é apertado para decidir um compromisso anual. É o desenho (urgência), mas se a conversão vier baixa, o primeiro botão a girar é aumentar o trial (ex: 10–14 dias).

---

## 5. Checklist de implementação

Marque conforme for entregando. A ordem respeita as dependências (banco → catálogo → backend → auth → frontend → validação).

### Fase 1 — Banco de dados
- [x] Adicionar `foundingMemberAt DateTime?` no model `Restaurante` (`backend/prisma/schema.prisma`)
- [x] Adicionar `foundingNumber Int?` no model `Restaurante` (opcional, p/ "Fundador #N")
- [x] Criar e aplicar a migration (`npx prisma migrate dev`) — `20260619184331_add_founding_member_and_plan_code`
- [x] Rodar `npx prisma generate` para atualizar o client

### Fase 2 — Catálogo de planos (server-side)
- [x] Criar `backend/src/pagamentos/planos.ts` com o mapa `planCode → { durationMonths, priceCents, label }` (`mensal`, `trimestral`, `anual`, `founder`)
- [x] Implementar função `precoEElegibilidade(planCode, restaurante)` que calcula preço e valida regras
- [x] Founder: só retornar R$ 500 se `trialing` E `trialEndsAt > agora` E `foundingMemberAt == null` E `count(fundadores) < 10`

### Fase 3 — Backend / pagamentos (`pagamentos.service.ts`)
- [x] `createCheckoutPreference`: receber `planCode` (não `planDurationMonths`)
- [x] `createCheckoutPreference`: calcular preço no backend pelo catálogo (nunca confiar no cliente)
- [x] `createCheckoutPreference`: validar vaga de fundador no ato
- [x] `createCheckoutPreference`: codificar `external_reference` como `sub-{restauranteId}-{planCode}-{ts}`
- [x] `updateRestauranteSubscription`: trocar `now + duração` por **`max(now, trialEndsAt) + duração`** (cumulativo)
- [x] `updateRestauranteSubscription`: se `planCode === 'founder'`, setar `foundingMemberAt`, `foundingNumber` e `planLabel = 'Fundador'`
- [x] `processWebhook`: extrair também o `planCode` do `external_reference` (hoje fixa `planDurationMonths: 1`)
- [x] `processWebhook`: revalidar `count < 10` na aprovação (consumo da vaga acontece aqui)
- [x] Novo endpoint `vagasFundador()` → `{ elegivel, vagasRestantes }` para a UI

### Fase 4 — Auth
- [x] `backend/src/auth/auth.service.ts`: `TRIAL_DIAS = 14 → 7`

### Fase 5 — Frontend (`frontend/src/pages/Admin/Assinatura.tsx`)
- [x] Buscar elegibilidade/vagas no endpoint novo
- [x] Exibir card **Fundador em destaque quando elegível** ("restam X de 10 vagas")
- [x] Mostrar os planos também durante o trial (hoje só aparecem em `assinaturaInativa`)
- [x] Trocar `abrirCheckout(1|3|12)` por `planCode`

### Fase 6 — Segurança e validação
- [x] Corrigir `POST /pagamentos` (cartão direto): `transaction_amount` agora calculado no backend pelo `planCode` (cliente não controla o preço)
- [ ] Testar fluxo de ponta a ponta com webhook (ngrok em dev)
- [ ] Testar limite global: o 11º fundador não consegue assinar como fundador
- [ ] Testar cumulativo: comprar durante o trial soma os dias restantes
- [ ] Testar que ex-fundador (ano encerrado) não recebe o fundador de novo na renovação

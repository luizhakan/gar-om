-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back');

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "mercadoPagoId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "statusDetail" TEXT,
    "transactionAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethodId" TEXT,
    "paymentTypeId" TEXT,
    "installments" INTEGER,
    "externalReference" TEXT,
    "description" TEXT,
    "payerEmail" TEXT,
    "payerIdentification" JSONB,
    "cardToken" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "pagamentoId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventAction" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "liveMode" BOOLEAN NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_pedidoId_key" ON "Pagamento"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_mercadoPagoId_key" ON "Pagamento"("mercadoPagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_idempotencyKey_key" ON "Pagamento"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

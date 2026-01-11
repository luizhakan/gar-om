-- CreateEnum
CREATE TYPE "ComandaStatus" AS ENUM ('aberta', 'encerrada');

-- CreateEnum
CREATE TYPE "DispositivoStatus" AS ENUM ('pendente', 'aprovado', 'recusado');

-- CreateTable
CREATE TABLE "Comanda" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "restauranteId" TEXT NOT NULL,
    "mesaAtualId" TEXT,
    "status" "ComandaStatus" NOT NULL DEFAULT 'aberta',
    "contaSolicitada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComandaDispositivo" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "apelido" TEXT,
    "tokenHash" TEXT,
    "master" BOOLEAN NOT NULL DEFAULT false,
    "status" "DispositivoStatus" NOT NULL DEFAULT 'pendente',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComandaDispositivo_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN "comandaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Comanda_codigo_key" ON "Comanda"("codigo");

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comanda" ADD CONSTRAINT "Comanda_mesaAtualId_fkey" FOREIGN KEY ("mesaAtualId") REFERENCES "Mesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComandaDispositivo" ADD CONSTRAINT "ComandaDispositivo_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda"("id") ON DELETE SET NULL ON UPDATE CASCADE;


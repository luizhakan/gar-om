/*
  Warnings:

  - You are about to drop the column `pedidoId` on the `Pagamento` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pagamento" DROP CONSTRAINT "Pagamento_pedidoId_fkey";

-- DropIndex
DROP INDEX "Pagamento_pedidoId_key";

-- AlterTable
ALTER TABLE "Pagamento" DROP COLUMN "pedidoId",
ADD COLUMN     "planDurationMonths" INTEGER NOT NULL DEFAULT 1;

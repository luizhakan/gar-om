-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "planCode" TEXT;

-- AlterTable
ALTER TABLE "Restaurante" ADD COLUMN     "foundingMemberAt" TIMESTAMP(3),
ADD COLUMN     "foundingNumber" INTEGER;

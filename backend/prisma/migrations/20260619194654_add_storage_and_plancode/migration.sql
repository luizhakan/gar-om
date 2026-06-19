-- AlterTable
ALTER TABLE "Restaurante" ADD COLUMN     "planCode" TEXT,
ADD COLUMN     "storageUsedBytes" BIGINT NOT NULL DEFAULT 0;

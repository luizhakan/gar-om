-- Add lastUsedAt for refresh token inactivity tracking
ALTER TABLE "RefreshToken"
ADD COLUMN "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

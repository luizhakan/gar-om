-- Passo 1: adiciona coluna de login (temporariamente opcional)
ALTER TABLE "UsuarioCozinha" ADD COLUMN "login" TEXT;

-- Passo 2: preenche login usando o nome do restaurante (slug) ou fallback para o id
UPDATE "UsuarioCozinha" uc
SET "login" = lower(regexp_replace(COALESCE(r."nome", uc."id"), '[^a-zA-Z0-9]+', '-', 'g'))
FROM "Restaurante" r
WHERE r."id" = uc."restauranteId";

-- Fallback para entradas que continuarem vazias/nulas
UPDATE "UsuarioCozinha"
SET "login" = CONCAT('cozinha-', SUBSTRING("restauranteId" FROM 1 FOR 8))
WHERE "login" IS NULL OR "login" = '';

-- Passo 3: aplica restrições e remove coluna antiga de email
ALTER TABLE "UsuarioCozinha" ALTER COLUMN "login" SET NOT NULL;
ALTER TABLE "UsuarioCozinha" ADD CONSTRAINT "UsuarioCozinha_login_key" UNIQUE ("login");
ALTER TABLE "UsuarioCozinha" ADD CONSTRAINT "UsuarioCozinha_restauranteId_key" UNIQUE ("restauranteId");
ALTER TABLE "UsuarioCozinha" DROP COLUMN IF EXISTS "email";

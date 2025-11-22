-- Ajusta drift: garante coluna "nome" em UsuarioCozinha com default e não nula
ALTER TABLE "UsuarioCozinha" ADD COLUMN IF NOT EXISTS "nome" TEXT NOT NULL DEFAULT 'Cozinha';

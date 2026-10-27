-- Migración manual 2026-10-27: Stock, Programa Fundadores, personalización y CRM de admin.
--
-- Para correr en Supabase → SQL Editor → New query: pegar TODO el archivo y
-- tocar "Run". Es equivalente a `npm run db:push` + `node scripts/apply-security.cjs`
-- + `npm run db:migrate-platform`, para cuando no hay una compu a mano.
--
-- Es idempotente: si se corre dos veces no rompe ni duplica nada. Va en una
-- transacción: si algo falla, no queda nada a medias.
--
-- Generado con `prisma migrate diff` entre el schema de main y el de esta versión.

BEGIN;

-- 1) ESQUEMA ------------------------------------------------------------------

-- AlterTable
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "accentColor" TEXT NOT NULL DEFAULT 'violeta',
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "crmStage" TEXT NOT NULL DEFAULT 'activo',
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "instagram" TEXT,
ADD COLUMN IF NOT EXISTS "isFounder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastWeeklySummaryAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "logoData" TEXT,
ADD COLUMN IF NOT EXISTS "logoUpdatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "weeklySummary" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "minStock" INTEGER,
ADD COLUMN IF NOT EXISTS "sku" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "trackStock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PlatformSetting" ADD COLUMN IF NOT EXISTS "followUpDays" INTEGER NOT NULL DEFAULT 14,
ALTER COLUMN "basePlanPrice" SET DEFAULT 35000;

-- CreateTable
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION,
    "supplier" TEXT,
    "note" TEXT,
    "purchaseId" TEXT,
    "cashMovementId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "viewport" TEXT NOT NULL DEFAULT '',
    "screenshot" TEXT,
    "fromImpersonation" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'nuevo',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'self',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminNote" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'nota',
    "body" TEXT NOT NULL,
    "campaignId" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'todos',
    "message" TEXT NOT NULL,
    "everyDays" INTEGER NOT NULL DEFAULT 14,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_businessId_createdAt_idx" ON "StockMovement"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_serviceId_idx" ON "StockMovement"("serviceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_purchaseId_idx" ON "StockMovement"("purchaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_businessId_idx" ON "Feedback"("businessId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasswordReset_userId_createdAt_idx" ON "PasswordReset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminNote_businessId_createdAt_idx" ON "AdminNote"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminNote_campaignId_idx" ON "AdminNote"("campaignId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdminCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) SEGURIDAD ----------------------------------------------------------------
-- Las tablas nuevas nacen con los permisos públicos de Supabase (API REST).
-- Lo mismo que hace prisma/security.sql: sin acceso para anon/authenticated y
-- RLS prendido sin políticas. No afecta a la app (usa el rol postgres).

REVOKE ALL ON "StockMovement", "Feedback", "PasswordReset", "AdminNote", "AdminCampaign" FROM anon, authenticated;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordReset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminCampaign" ENABLE ROW LEVEL SECURITY;

-- 3) DATOS (= npm run db:migrate-platform) -------------------------------------

-- Plan base: $35.000 si nunca se cargó un precio.
INSERT INTO "PlatformSetting" ("id", "basePlanPrice", "updatedAt")
VALUES ('singleton', 35000, NOW())
ON CONFLICT ("id") DO NOTHING;
UPDATE "PlatformSetting" SET "basePlanPrice" = 35000, "updatedAt" = NOW()
WHERE "id" = 'singleton' AND "basePlanPrice" = 0;

-- Precios nuevos de módulos, solo donde sigue el precio viejo de catálogo
-- (si lo cambiaste a mano desde /admin/modulos, no se toca).
UPDATE "Module" SET "monthlyPrice" = 8900  WHERE "code" = 'puntos'           AND "monthlyPrice" = 9900;
UPDATE "Module" SET "monthlyPrice" = 16900 WHERE "code" = 'stock'            AND "monthlyPrice" = 21900;
UPDATE "Module" SET "monthlyPrice" = 22900 WHERE "code" = 'pos'              AND "monthlyPrice" = 26900;
UPDATE "Module" SET "monthlyPrice" = 22900 WHERE "code" = 'caja'             AND "monthlyPrice" = 26900;
UPDATE "Module" SET "monthlyPrice" = 10900 WHERE "code" = 'gastos'           AND "monthlyPrice" = 12900;
UPDATE "Module" SET "monthlyPrice" = 10900 WHERE "code" = 'cuenta-corriente' AND "monthlyPrice" = 12900;
UPDATE "Module" SET "monthlyPrice" = 14900 WHERE "code" = 'turnos'           AND "monthlyPrice" = 17900;
UPDATE "Module" SET "monthlyPrice" = 12900 WHERE "code" = 'catalogo'         AND "monthlyPrice" = 14900;

-- Solo se ofrece lo que está construido.
UPDATE "Module" SET "available" = true  WHERE "code" IN ('puntos', 'caja', 'stock');
UPDATE "Module" SET "available" = false WHERE "code" IN ('pos', 'gastos', 'cuenta-corriente', 'turnos', 'catalogo');

-- Stock ya existe: descripción real.
UPDATE "Module" SET "description" =
  'Stock por producto que se descuenta solo con cada venta, carga de mercadería (pagada desde la caja si querés), alertas para reponer, pedido listo para el proveedor y ganancia real por venta.'
WHERE "code" = 'stock';

-- "Barbería demo" cargada como negocio real: demo y exenta (no suma al MRR).
UPDATE "Business" SET "isDemo" = true, "billingExempt" = true
WHERE "isDemo" = false AND "name" ~* 'barber[ií]a\s+demo';

COMMIT;

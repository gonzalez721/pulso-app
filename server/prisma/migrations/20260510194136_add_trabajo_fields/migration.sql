-- AlterTable: add ingresoMensual and horasTrabajoSemanal to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ingresoMensual" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "horasTrabajoSemanal" INTEGER;

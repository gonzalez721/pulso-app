-- CreateTable
CREATE TABLE "PactoRelacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modo" TEXT NOT NULL DEFAULT 'humano',
    "partnerNombre" TEXT,
    "partnerEmail" TEXT,
    "pushSubscription" JSONB,
    "inviteToken" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "activadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PactoRelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PactoAlerta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pactoId" TEXT NOT NULL,
    "tiposRiesgo" TEXT[],
    "puntuacion" DOUBLE PRECISION NOT NULL,
    "contexto" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'esperando',
    "mensajePartner" TEXT,
    "mensajeAuto" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PactoAlerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PactoRelacion_userId_key" ON "PactoRelacion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PactoRelacion_inviteToken_key" ON "PactoRelacion"("inviteToken");

-- CreateIndex
CREATE INDEX "PactoRelacion_inviteToken_idx" ON "PactoRelacion"("inviteToken");

-- CreateIndex
CREATE INDEX "PactoAlerta_userId_idx" ON "PactoAlerta"("userId");

-- CreateIndex
CREATE INDEX "PactoAlerta_pactoId_idx" ON "PactoAlerta"("pactoId");

-- CreateIndex
CREATE INDEX "PactoAlerta_expiresAt_idx" ON "PactoAlerta"("expiresAt");

-- AddForeignKey
ALTER TABLE "PactoRelacion" ADD CONSTRAINT "PactoRelacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PactoAlerta" ADD CONSTRAINT "PactoAlerta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PactoAlerta" ADD CONSTRAINT "PactoAlerta_pactoId_fkey" FOREIGN KEY ("pactoId") REFERENCES "PactoRelacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

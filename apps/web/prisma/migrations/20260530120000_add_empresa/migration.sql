-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "empresaId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "comercialName" TEXT,
    "nif" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Empresa_ownerId_idx" ON "Empresa"("ownerId");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;


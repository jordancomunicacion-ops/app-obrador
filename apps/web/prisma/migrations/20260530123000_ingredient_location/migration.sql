-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "Ingredient_locationId_idx" ON "Ingredient"("locationId");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;


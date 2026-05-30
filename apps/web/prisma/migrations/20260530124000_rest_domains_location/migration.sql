-- AlterTable
ALTER TABLE "MasterProduct" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "SupplierProduct" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "MenuService" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "MasterProduct_locationId_idx" ON "MasterProduct"("locationId");

-- CreateIndex
CREATE INDEX "Supplier_locationId_idx" ON "Supplier"("locationId");

-- CreateIndex
CREATE INDEX "SupplierProduct_locationId_idx" ON "SupplierProduct"("locationId");

-- CreateIndex
CREATE INDEX "Event_locationId_idx" ON "Event"("locationId");

-- CreateIndex
CREATE INDEX "Task_locationId_idx" ON "Task"("locationId");

-- CreateIndex
CREATE INDEX "MenuService_locationId_idx" ON "MenuService"("locationId");

-- AddForeignKey
ALTER TABLE "MasterProduct" ADD CONSTRAINT "MasterProduct_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuService" ADD CONSTRAINT "MenuService_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;


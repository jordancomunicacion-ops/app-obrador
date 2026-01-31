-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "allergens" TEXT,
ADD COLUMN     "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLactoseFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegetarian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecipePackaging" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'ENVASE';

-- AlterTable
ALTER TABLE "RecipeStep" ADD COLUMN     "subRecipeId" TEXT;

-- AlterTable
ALTER TABLE "SupplierProduct" ADD COLUMN     "ingredientId" TEXT,
ADD COLUMN     "masterProductId" TEXT,
ADD COLUMN     "quantityPerUnit" DOUBLE PRECISION,
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "action" TEXT,
ADD COLUMN     "issueReason" TEXT,
ADD COLUMN     "technique" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "Transformation" ADD COLUMN     "testUnit" TEXT NOT NULL DEFAULT 'KG';

-- CreateTable
CREATE TABLE "MasterProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeStepIngredient" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "subRecipeId" TEXT,
    "action" TEXT,
    "subAction" TEXT,

    CONSTRAINT "RecipeStepIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timbre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timbre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "timbreId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "volumeLevel" TEXT NOT NULL,
    "serviceRhythm" TEXT NOT NULL,
    "shelfId" TEXT,
    "assignedGN" TEXT,
    "assignedDepth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuServiceItem" (
    "id" TEXT NOT NULL,
    "menuServiceId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "estimatedPax" INTEGER NOT NULL DEFAULT 0,
    "realPax" INTEGER,

    CONSTRAINT "MenuServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSIntegration" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "baseUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recipeId" TEXT NOT NULL,
    "quantitySold" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_EventTasks_AB_unique" ON "_EventTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_EventTasks_B_index" ON "_EventTasks"("B");

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_masterProductId_fkey" FOREIGN KEY ("masterProductId") REFERENCES "MasterProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStep" ADD CONSTRAINT "RecipeStep_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepIngredient" ADD CONSTRAINT "RecipeStepIngredient_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "RecipeStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepIngredient" ADD CONSTRAINT "RecipeStepIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeStepIngredient" ADD CONSTRAINT "RecipeStepIngredient_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_timbreId_fkey" FOREIGN KEY ("timbreId") REFERENCES "Timbre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partition" ADD CONSTRAINT "Partition_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuServiceItem" ADD CONSTRAINT "MenuServiceItem_menuServiceId_fkey" FOREIGN KEY ("menuServiceId") REFERENCES "MenuService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuServiceItem" ADD CONSTRAINT "MenuServiceItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRecord" ADD CONSTRAINT "SalesRecord_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTasks" ADD CONSTRAINT "_EventTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTasks" ADD CONSTRAINT "_EventTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

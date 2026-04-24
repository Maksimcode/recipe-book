/*
  Warnings:

  - Added the required column `caloriesPerPortion` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbsPerPortion` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fatPerPortion` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portionSizeGrams` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proteinPerPortion` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Made the column `grams` on table `DishIngredient` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "DishPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DishPhoto_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "caloriesPerPortion" DECIMAL NOT NULL,
    "proteinPerPortion" DECIMAL NOT NULL,
    "fatPerPortion" DECIMAL NOT NULL,
    "carbsPerPortion" DECIMAL NOT NULL,
    "portionSizeGrams" DECIMAL NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
    "isNutritionManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dish" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE INDEX "Dish_name_idx" ON "Dish"("name");
CREATE INDEX "Dish_category_isVegan_isGlutenFree_isSugarFree_idx" ON "Dish"("category", "isVegan", "isGlutenFree", "isSugarFree");
CREATE TABLE "new_DishIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dishId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "grams" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DishIngredient_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DishIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DishIngredient" ("createdAt", "dishId", "grams", "id", "productId") SELECT "createdAt", "dishId", "grams", "id", "productId" FROM "DishIngredient";
DROP TABLE "DishIngredient";
ALTER TABLE "new_DishIngredient" RENAME TO "DishIngredient";
CREATE INDEX "DishIngredient_productId_dishId_idx" ON "DishIngredient"("productId", "dishId");
CREATE UNIQUE INDEX "DishIngredient_dishId_productId_key" ON "DishIngredient"("dishId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DishPhoto_dishId_sortOrder_idx" ON "DishPhoto"("dishId", "sortOrder");

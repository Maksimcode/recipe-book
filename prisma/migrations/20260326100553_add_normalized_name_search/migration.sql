/*
  Warnings:

  - Added the required column `nameNormalized` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameNormalized` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "caloriesPerPortion" DECIMAL NOT NULL,
    "proteinPerPortion" DECIMAL NOT NULL,
    "fatPerPortion" DECIMAL NOT NULL,
    "carbsPerPortion" DECIMAL NOT NULL,
    "portionSizeGrams" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
    "isNutritionManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_Dish" ("caloriesPerPortion", "carbsPerPortion", "category", "createdAt", "fatPerPortion", "id", "isGlutenFree", "isNutritionManuallyEdited", "isSugarFree", "isVegan", "name", "portionSizeGrams", "proteinPerPortion", "updatedAt") SELECT "caloriesPerPortion", "carbsPerPortion", "category", "createdAt", "fatPerPortion", "id", "isGlutenFree", "isNutritionManuallyEdited", "isSugarFree", "isVegan", "name", "portionSizeGrams", "proteinPerPortion", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE INDEX "Dish_name_idx" ON "Dish"("name");
CREATE INDEX "Dish_nameNormalized_idx" ON "Dish"("nameNormalized");
CREATE INDEX "Dish_category_isVegan_isGlutenFree_isSugarFree_idx" ON "Dish"("category", "isVegan", "isGlutenFree", "isSugarFree");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "caloriesPer100g" DECIMAL NOT NULL,
    "proteinPer100g" DECIMAL NOT NULL,
    "fatPer100g" DECIMAL NOT NULL,
    "carbsPer100g" DECIMAL NOT NULL,
    "ingredientsComposition" TEXT,
    "category" TEXT NOT NULL,
    "cookingState" TEXT NOT NULL,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isSugarFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_Product" ("caloriesPer100g", "carbsPer100g", "category", "cookingState", "createdAt", "fatPer100g", "id", "ingredientsComposition", "isGlutenFree", "isSugarFree", "isVegan", "name", "proteinPer100g", "updatedAt") SELECT "caloriesPer100g", "carbsPer100g", "category", "cookingState", "createdAt", "fatPer100g", "id", "ingredientsComposition", "isGlutenFree", "isSugarFree", "isVegan", "name", "proteinPer100g", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_nameNormalized_idx" ON "Product"("nameNormalized");
CREATE INDEX "Product_category_cookingState_isVegan_isGlutenFree_isSugarFree_idx" ON "Product"("category", "cookingState", "isVegan", "isGlutenFree", "isSugarFree");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

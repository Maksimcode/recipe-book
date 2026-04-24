export const dishCategories = [
  "DESSERT",
  "FIRST",
  "SECOND",
  "DRINK",
  "SALAD",
  "SOUP",
  "SNACK",
] as const;

export type DishCategoryValue = (typeof dishCategories)[number];

export type IngredientInput = {
  productId: string;
  grams: number;
};

export type NutritionValues = {
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbsPerPortion: number;
};

export type ProductNutritionSource = {
  id: string;
  caloriesPer100g: unknown;
  proteinPer100g: unknown;
  fatPer100g: unknown;
  carbsPer100g: unknown;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
};

const categoryMacroMap: Array<{ macro: string; category: DishCategoryValue }> = [
  { macro: "!десерт", category: "DESSERT" },
  { macro: "!первое", category: "FIRST" },
  { macro: "!второе", category: "SECOND" },
  { macro: "!напиток", category: "DRINK" },
  { macro: "!салат", category: "SALAD" },
  { macro: "!суп", category: "SOUP" },
  { macro: "!перекус", category: "SNACK" },
];

export function parseBooleanFilter(
  value: string | null,
  fieldName: string,
): boolean | undefined {
  if (value === null || value.length === 0) {
    return undefined;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`Query param "${fieldName}" must be "true" or "false".`);
}

export function toNonNegativeNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Field "${fieldName}" must be a non-negative number.`);
  }
  return value;
}

export function parseMacroCategory(rawName: string): {
  cleanedName: string;
  macroCategory?: DishCategoryValue;
} {
  const lower = rawName.toLowerCase();
  const found = categoryMacroMap
    .map((item) => ({ ...item, index: lower.indexOf(item.macro) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index)[0];

  if (!found) {
    return { cleanedName: rawName.trim() };
  }

  const cleanedName = `${rawName.slice(0, found.index)}${rawName.slice(found.index + found.macro.length)}`
    .replace(/\s+/g, " ")
    .trim();

  return { cleanedName, macroCategory: found.category };
}

export function parseIngredientsInput(value: unknown): IngredientInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Field "ingredients" must be a non-empty array.');
  }

  const ingredients = value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Ingredient at index ${index} must be an object.`);
    }

    const raw = item as { productId?: unknown; grams?: unknown };
    if (typeof raw.productId !== "string" || raw.productId.trim().length === 0) {
      throw new Error(`Ingredient at index ${index} must have a valid "productId".`);
    }

    const grams = toNonNegativeNumber(raw.grams, `ingredients[${index}].grams`);
    if (grams <= 0) {
      throw new Error(`Field "ingredients[${index}].grams" must be greater than 0.`);
    }

    return { productId: raw.productId.trim(), grams };
  });

  const uniqueProductIds = new Set(ingredients.map((item) => item.productId));
  if (uniqueProductIds.size !== ingredients.length) {
    throw new Error('Field "ingredients" cannot contain duplicate "productId" values.');
  }

  return ingredients;
}

export function findMissingProductIds(
  ingredients: IngredientInput[],
  products: Array<{ id: string }>,
): string[] {
  const existingIds = new Set(products.map((item) => item.id));
  return ingredients
    .map((item) => item.productId)
    .filter((productId) => !existingIds.has(productId));
}

export function calculateAutoNutrition(
  ingredients: IngredientInput[],
  productMap: Map<string, ProductNutritionSource>,
): NutritionValues {
  return ingredients.reduce(
    (acc, ingredient) => {
      const product = productMap.get(ingredient.productId)!;
      const ratio = ingredient.grams / 100;
      acc.caloriesPerPortion += Number(product.caloriesPer100g) * ratio;
      acc.proteinPerPortion += Number(product.proteinPer100g) * ratio;
      acc.fatPerPortion += Number(product.fatPer100g) * ratio;
      acc.carbsPerPortion += Number(product.carbsPer100g) * ratio;
      return acc;
    },
    { caloriesPerPortion: 0, proteinPerPortion: 0, fatPerPortion: 0, carbsPerPortion: 0 },
  );
}

export function calculatePer100g(nutrition: NutritionValues, portionSizeGrams: number) {
  return {
    calories: (nutrition.caloriesPerPortion * 100) / portionSizeGrams,
    protein: (nutrition.proteinPerPortion * 100) / portionSizeGrams,
    fat: (nutrition.fatPerPortion * 100) / portionSizeGrams,
    carbs: (nutrition.carbsPerPortion * 100) / portionSizeGrams,
  };
}

export function calculateBjuPer100gSum(
  nutrition: NutritionValues,
  portionSizeGrams: number,
): number {
  return (
    ((nutrition.proteinPerPortion + nutrition.fatPerPortion + nutrition.carbsPerPortion) * 100) /
    portionSizeGrams
  );
}

export function calculateFlagsAvailability(products: ProductNutritionSource[]) {
  return {
    isVegan: products.every((product) => product.isVegan),
    isGlutenFree: products.every((product) => product.isGlutenFree),
    isSugarFree: products.every((product) => product.isSugarFree),
  };
}

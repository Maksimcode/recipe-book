export const dishCategoryOptions = [
  { value: "DESSERT", label: "Десерт" },
  { value: "FIRST", label: "Первое" },
  { value: "SECOND", label: "Второе" },
  { value: "DRINK", label: "Напиток" },
  { value: "SALAD", label: "Салат" },
  { value: "SOUP", label: "Суп" },
  { value: "SNACK", label: "Перекус" },
] as const;

export type DishIngredientDto = {
  id: string;
  productId: string;
  grams: number;
  product?: {
    id: string;
    name: string;
    caloriesPer100g?: number;
    proteinPer100g?: number;
    fatPer100g?: number;
    carbsPer100g?: number;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    isSugarFree?: boolean;
  };
};

export type DishDto = {
  id: string;
  name: string;
  nameNormalized: string;
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbsPerPortion: number;
  portionSizeGrams: number;
  category: (typeof dishCategoryOptions)[number]["value"];
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
  isNutritionManuallyEdited: boolean;
  createdAt: string;
  updatedAt: string | null;
  photos: Array<{ id: string; photoUrl: string; sortOrder: number }>;
  ingredients: DishIngredientDto[];
};

export type ProductShortDto = {
  id: string;
  name: string;
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
};

export function getDishCategoryLabel(value: string): string {
  return dishCategoryOptions.find((item) => item.value === value)?.label ?? value;
}

export function getDishPer100gNutrition(input: {
  caloriesPerPortion: number;
  proteinPerPortion: number;
  fatPerPortion: number;
  carbsPerPortion: number;
  portionSizeGrams: number;
}) {
  const portion = Number(input.portionSizeGrams);
  if (!Number.isFinite(portion) || portion <= 0) {
    return {
      caloriesPer100g: 0,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbsPer100g: 0,
      bjuSumPer100g: 0,
    };
  }

  const factor = 100 / portion;
  const caloriesPer100g = Number((input.caloriesPerPortion * factor).toFixed(2));
  const proteinPer100g = Number((input.proteinPerPortion * factor).toFixed(2));
  const fatPer100g = Number((input.fatPerPortion * factor).toFixed(2));
  const carbsPer100g = Number((input.carbsPerPortion * factor).toFixed(2));
  const bjuSumPer100g = Number((proteinPer100g + fatPer100g + carbsPer100g).toFixed(2));

  return {
    caloriesPer100g,
    proteinPer100g,
    fatPer100g,
    carbsPer100g,
    bjuSumPer100g,
  };
}

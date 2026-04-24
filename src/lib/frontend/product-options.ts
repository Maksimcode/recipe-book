export const productCategoryOptions = [
  { value: "FROZEN", label: "Замороженный" },
  { value: "MEAT", label: "Мясной" },
  { value: "VEGETABLES", label: "Овощи" },
  { value: "GREENS", label: "Зелень" },
  { value: "SPICES", label: "Специи" },
  { value: "GRAINS", label: "Крупы" },
  { value: "CANNED", label: "Консервы" },
  { value: "LIQUID", label: "Жидкость" },
  { value: "SWEETS", label: "Сладости" },
] as const;

export const productCookingStateOptions = [
  { value: "READY_TO_EAT", label: "Готовый к употреблению" },
  { value: "SEMI_FINISHED", label: "Полуфабрикат" },
  { value: "REQUIRES_COOKING", label: "Требует приготовления" },
] as const;

export type ProductDto = {
  id: string;
  name: string;
  nameNormalized: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  ingredientsComposition: string | null;
  category: (typeof productCategoryOptions)[number]["value"];
  cookingState: (typeof productCookingStateOptions)[number]["value"];
  isVegan: boolean;
  isGlutenFree: boolean;
  isSugarFree: boolean;
  createdAt: string;
  updatedAt: string | null;
  photos: Array<{ id: string; photoUrl: string; sortOrder: number }>;
};

export function getCategoryLabel(value: string): string {
  return productCategoryOptions.find((item) => item.value === value)?.label ?? value;
}

export function getCookingStateLabel(value: string): string {
  return productCookingStateOptions.find((item) => item.value === value)?.label ?? value;
}

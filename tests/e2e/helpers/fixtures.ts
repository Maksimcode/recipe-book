/**
 * Тестовые данные для UI/e2e и вызовов API из Playwright `request`.
 */

export const VALID_PRODUCT_API_BODY = {
  name: "Пшено",
  caloriesPer100g: 120,
  proteinPer100g: 10,
  fatPer100g: 5,
  carbsPer100g: 15,
  category: "GRAINS",
  cookingState: "READY_TO_EAT",
} as const;

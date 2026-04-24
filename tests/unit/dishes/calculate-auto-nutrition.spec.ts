import { describe, expect, it } from "vitest";

import {
  calculateAutoNutrition,
  type IngredientInput,
  type ProductNutritionSource,
} from "../../../src/lib/dishes/domain";

function buildProduct(overrides: Partial<ProductNutritionSource>): ProductNutritionSource {
  return {
    id: "default-product",
    caloriesPer100g: 0,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 0,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    ...overrides,
  };
}

function buildMap(products: ProductNutritionSource[]) {
  return new Map(products.map((product) => [product.id, product]));
}

describe("calculateAutoNutrition", () => {
  /**
   * Проверяем корректность автоподсчета пищевой ценности блюда
   * на представителях валидных классов входных данных.
   */
  describe("Эквивалентное разбиение", () => {
    /** Класс: один ингредиент с целыми значениями. */
    it("корректно считает пищевую ценность для одного ингредиента", () => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams: 200 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 250,
          proteinPer100g: 10,
          fatPer100g: 5,
          carbsPer100g: 20,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result).toEqual({
        caloriesPerPortion: 500,
        proteinPerPortion: 20,
        fatPerPortion: 10,
        carbsPerPortion: 40,
      });
    });

    /** Класс: несколько ингредиентов, требуется суммирование вкладов. */
    it("корректно суммирует пищевую ценность нескольких ингредиентов", () => {
      const ingredients: IngredientInput[] = [
        { productId: "p1", grams: 100 },
        { productId: "p2", grams: 250 },
      ];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 80,
          proteinPer100g: 4,
          fatPer100g: 2,
          carbsPer100g: 10,
        }),
        buildProduct({
          id: "p2",
          caloriesPer100g: 120,
          proteinPer100g: 8,
          fatPer100g: 3,
          carbsPer100g: 15,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBeCloseTo(380, 10);
      expect(result.proteinPerPortion).toBeCloseTo(24, 10);
      expect(result.fatPerPortion).toBeCloseTo(9.5, 10);
      expect(result.carbsPerPortion).toBeCloseTo(47.5, 10);
    });

    /** Класс: дробные grams и дробные БЖУ/калории у продукта. */
    it("поддерживает дробные значения без критической потери точности", () => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams: 33.3 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 123.45,
          proteinPer100g: 6.78,
          fatPer100g: 9.01,
          carbsPer100g: 11.12,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBeCloseTo(41.10885, 8);
      expect(result.proteinPerPortion).toBeCloseTo(2.25774, 8);
      expect(result.fatPerPortion).toBeCloseTo(3.00033, 8);
      expect(result.carbsPerPortion).toBeCloseTo(3.70296, 8);
    });

    /** Класс: строковые числа в питательных полях (коэрсия через Number). */
    it("преобразует строковые числовые значения из полей пищевой ценности продукта", () => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams: 50 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: "200",
          proteinPer100g: "20.5",
          fatPer100g: "4",
          carbsPer100g: "12.5",
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBeCloseTo(100, 10);
      expect(result.proteinPerPortion).toBeCloseTo(10.25, 10);
      expect(result.fatPerPortion).toBeCloseTo(2, 10);
      expect(result.carbsPerPortion).toBeCloseTo(6.25, 10);
    });
  });

  /**
   * Проверяем поведение функции на граничных значениях входа.
   */
  describe("Анализ граничных значений", () => {
    /** Граница вокруг 100г: ниже, ровно, выше. */
    it.each([
      { grams: 99.999, expectedCalories: 99.999 },
      { grams: 100, expectedCalories: 100 },
      { grams: 100.001, expectedCalories: 100.001 },
    ])(
      "корректно масштабирует калорийность около границы 100 г при grams=$grams",
      ({ grams, expectedCalories }) => {
        const ingredients: IngredientInput[] = [{ productId: "p1", grams }];
        const productMap = buildMap([
          buildProduct({
            id: "p1",
            caloriesPer100g: 100,
          }),
        ]);

        const result = calculateAutoNutrition(ingredients, productMap);

        expect(result.caloriesPerPortion).toBeCloseTo(expectedCalories, 8);
      },
    );

    /** Нижняя граница grams: ноль и минимально положительное значение. */
    it.each([
      { grams: 0, expectedCalories: 0 },
      { grams: 0.0001, expectedCalories: 0.0002 },
    ])("корректно обрабатывает нижнюю границу grams при grams=$grams", ({ grams, expectedCalories }) => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 200,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBeCloseTo(expectedCalories, 10);
    });

    /** Верхняя практическая граница grams: очень большое конечное число. */
    it("возвращает конечные значения для очень больших grams", () => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams: 1_000_000 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 250,
          proteinPer100g: 12,
          fatPer100g: 8,
          carbsPer100g: 30,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(Number.isFinite(result.caloriesPerPortion)).toBe(true);
      expect(Number.isFinite(result.proteinPerPortion)).toBe(true);
      expect(Number.isFinite(result.fatPerPortion)).toBe(true);
      expect(Number.isFinite(result.carbsPerPortion)).toBe(true);
      expect(result.caloriesPerPortion).toBe(2_500_000);
    });
  });
});

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

  /**
   * Дополнительные corner cases: поведение функции при нетипичных,
   * но реально возможных комбинациях входных данных.
   */
  describe("Corner cases", () => {
    /** Пустой список ингредиентов: reduce возвращает нулевой объект. */
    it("возвращает нули при пустом списке ингредиентов", () => {
      const result = calculateAutoNutrition([], new Map());

      expect(result).toEqual({
        caloriesPerPortion: 0,
        proteinPerPortion: 0,
        fatPerPortion: 0,
        carbsPerPortion: 0,
      });
    });

    /** Нарушение контракта: продукт из ингредиентов отсутствует в Map. */
    it("бросает при отсутствии продукта в productMap", () => {
      const ingredients: IngredientInput[] = [{ productId: "missing", grams: 100 }];
      const productMap = new Map<string, ProductNutritionSource>();

      expect(() => calculateAutoNutrition(ingredients, productMap)).toThrow();
    });

    /** Линейность: удвоение grams ровно удваивает все поля результата. */
    it("удвоение grams удваивает все поля пищевой ценности", () => {
      const base: IngredientInput[] = [{ productId: "p1", grams: 100 }];
      const doubled: IngredientInput[] = [{ productId: "p1", grams: 200 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 150,
          proteinPer100g: 20,
          fatPer100g: 5,
          carbsPer100g: 15,
        }),
      ]);

      const r1 = calculateAutoNutrition(base, productMap);
      const r2 = calculateAutoNutrition(doubled, productMap);

      expect(r2.caloriesPerPortion).toBeCloseTo(r1.caloriesPerPortion * 2, 10);
      expect(r2.proteinPerPortion).toBeCloseTo(r1.proteinPerPortion * 2, 10);
      expect(r2.fatPerPortion).toBeCloseTo(r1.fatPerPortion * 2, 10);
      expect(r2.carbsPerPortion).toBeCloseTo(r1.carbsPerPortion * 2, 10);
    });

    /** Продукт с нулевыми КБЖУ (например вода) не изменяет общий итог. */
    it("продукт с нулевыми КБЖУ не влияет на итоговую пищевую ценность", () => {
      const ingredients: IngredientInput[] = [
        { productId: "chicken", grams: 150 },
        { productId: "water", grams: 200 },
      ];
      const productMap = buildMap([
        buildProduct({
          id: "chicken",
          caloriesPer100g: 165,
          proteinPer100g: 31,
          fatPer100g: 3.6,
          carbsPer100g: 0,
        }),
        buildProduct({
          id: "water",
          caloriesPer100g: 0,
          proteinPer100g: 0,
          fatPer100g: 0,
          carbsPer100g: 0,
        }),
      ]);

      const withWater = calculateAutoNutrition(ingredients, productMap);
      const withoutWater = calculateAutoNutrition(
        [{ productId: "chicken", grams: 150 }],
        productMap,
      );

      expect(withWater.caloriesPerPortion).toBeCloseTo(withoutWater.caloriesPerPortion, 10);
      expect(withWater.proteinPerPortion).toBeCloseTo(withoutWater.proteinPerPortion, 10);
    });

    /** Реалистичный рецепт: куриная грудка + гречка. */
    it("корректно считает пищевую ценность реалистичного рецепта", () => {
      const ingredients: IngredientInput[] = [
        { productId: "chicken", grams: 200 },
        { productId: "buckwheat", grams: 150 },
      ];
      const productMap = buildMap([
        buildProduct({
          id: "chicken",
          caloriesPer100g: 165,
          proteinPer100g: 31,
          fatPer100g: 3.6,
          carbsPer100g: 0,
        }),
        buildProduct({
          id: "buckwheat",
          caloriesPer100g: 343,
          proteinPer100g: 13,
          fatPer100g: 3.4,
          carbsPer100g: 72,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      // 200г курицы: 330 ккал, 62г белок, 7.2г жир, 0г угли
      // 150г гречки: 514.5 ккал, 19.5г белок, 5.1г жир, 108г угли
      expect(result.caloriesPerPortion).toBeCloseTo(844.5, 8);
      expect(result.proteinPerPortion).toBeCloseTo(81.5, 8);
      expect(result.fatPerPortion).toBeCloseTo(12.3, 8);
      expect(result.carbsPerPortion).toBeCloseTo(108, 8);
    });

    /** Маленькая реалистичная граммовка: 5г специй почти не влияют на калорийность. */
    it("правильно считает вклад маленькой граммовки (5г специй)", () => {
      const ingredients: IngredientInput[] = [{ productId: "spice", grams: 5 }];
      const productMap = buildMap([
        buildProduct({
          id: "spice",
          caloriesPer100g: 250,
          proteinPer100g: 10,
          fatPer100g: 5,
          carbsPer100g: 30,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBeCloseTo(12.5, 10);
      expect(result.proteinPerPortion).toBeCloseTo(0.5, 10);
      expect(result.fatPerPortion).toBeCloseTo(0.25, 10);
      expect(result.carbsPerPortion).toBeCloseTo(1.5, 10);
    });

    /** Ингредиент без жиров и углеводов: вклад только в калории и белок. */
    it("продукт без жиров и углеводов вносит вклад только в калории и белок", () => {
      const ingredients: IngredientInput[] = [{ productId: "p1", grams: 100 }];
      const productMap = buildMap([
        buildProduct({
          id: "p1",
          caloriesPer100g: 120,
          proteinPer100g: 26,
          fatPer100g: 0,
          carbsPer100g: 0,
        }),
      ]);

      const result = calculateAutoNutrition(ingredients, productMap);

      expect(result.caloriesPerPortion).toBe(120);
      expect(result.proteinPerPortion).toBe(26);
      expect(result.fatPerPortion).toBe(0);
      expect(result.carbsPerPortion).toBe(0);
    });

  });
});

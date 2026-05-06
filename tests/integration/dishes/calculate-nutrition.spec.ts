import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createProduct, deleteProduct } from "../helpers/fixtures";

describe("POST /api/dishes/calculate-nutrition", () => {
  let productId: string;
  let veganProductId: string;
  let nonVeganProductId: string;

  beforeAll(async () => {
    const base = await createProduct({
      name: "Продукт для calculate (базовый)",
      caloriesPer100g: 200,
      proteinPer100g: 10,
      fatPer100g: 8,
      carbsPer100g: 20,
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    productId = base.id;

    const vegan = await createProduct({
      name: "Веганский продукт для calculate",
      caloriesPer100g: 80,
      proteinPer100g: 3,
      fatPer100g: 1,
      carbsPer100g: 15,
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    veganProductId = vegan.id;

    const nonVegan = await createProduct({
      name: "Невеганский продукт для calculate",
      caloriesPer100g: 300,
      proteinPer100g: 25,
      fatPer100g: 20,
      carbsPer100g: 5,
      isVegan: false,
      isGlutenFree: false,
      isSugarFree: false,
    });
    nonVeganProductId = nonVegan.id;
  });

  afterAll(async () => {
    await deleteProduct(productId);
    await deleteProduct(veganProductId);
    await deleteProduct(nonVeganProductId);
  });

  function calcBody(overrides: Record<string, unknown> = {}) {
    return {
      ingredients: [{ productId, grams: 100 }],
      portionSizeGrams: 100,
      ...overrides,
    };
  }

  describe("Эквивалентное разбиение — структура ответа", () => {
    it("возвращает 200 и все ожидаемые поля при валидном запросе", async () => {
      const res = await api.post("/api/dishes/calculate-nutrition", calcBody());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.autoNutrition");
      expect(res.body).toHaveProperty("data.per100g");
      expect(res.body).toHaveProperty("data.flagsAvailability");
      expect(res.body).toHaveProperty("data.categoryDetectedFromMacro");
      expect(res.body).toHaveProperty("data.suggestedName");
    });
  });

  describe("Эквивалентное разбиение/BVA — расчет calories", () => {
    it.each([
      {
        caseName: "100 г от продукта 200 ккал/100г -> 200",
        grams: 100,
        expectedCalories: 200,
      },
      {
        caseName: "50 г -> 100",
        grams: 50,
        expectedCalories: 100,
      },
    ])("$caseName", async ({ grams, expectedCalories }) => {
      const res = await api.post<{
        data: { autoNutrition: { caloriesPerPortion: number } };
      }>("/api/dishes/calculate-nutrition", calcBody({ ingredients: [{ productId, grams }] }));

      expect(res.status).toBe(200);
      const actual = (
        res.body as { data: { autoNutrition: { caloriesPerPortion: number } } }
      ).data.autoNutrition.caloriesPerPortion;
      expect(actual).toBeCloseTo(expectedCalories, 3);
    });

    it("суммирует калории от нескольких ингредиентов", async () => {
      const res = await api.post<{
        data: { autoNutrition: { caloriesPerPortion: number } };
      }>("/api/dishes/calculate-nutrition", {
        ingredients: [
          { productId, grams: 100 },
          { productId: veganProductId, grams: 100 },
        ],
        portionSizeGrams: 200,
      });

      expect(res.status).toBe(200);
      const calories = (
        res.body as { data: { autoNutrition: { caloriesPerPortion: number } } }
      ).data.autoNutrition.caloriesPerPortion;
      expect(calories).toBeCloseTo(200 + 80, 3);
    });
  });

  describe("Эквивалентное разбиение — поле ingredients", () => {
    it("пустой массив ingredients → 400", async () => {
      const res = await api.post(
        "/api/dishes/calculate-nutrition",
        calcBody({ ingredients: [] }),
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });

    it("несуществующий productId → 400", async () => {
      const res = await api.post("/api/dishes/calculate-nutrition", {
        ingredients: [{ productId: "nonexistent-product-id", grams: 100 }],
        portionSizeGrams: 100,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });
  });

  describe("Эквивалентное разбиение — flagsAvailability", () => {
    it("один невеганский продукт → isVegan=false", async () => {
      const res = await api.post<{ data: { flagsAvailability: { isVegan: boolean } } }>(
        "/api/dishes/calculate-nutrition",
        {
          ingredients: [
            { productId: veganProductId, grams: 100 },
            { productId: nonVeganProductId, grams: 50 },
          ],
          portionSizeGrams: 150,
        },
      );

      expect(res.status).toBe(200);
      expect(
        (res.body as { data: { flagsAvailability: { isVegan: boolean } } }).data.flagsAvailability
          .isVegan,
      ).toBe(false);
    });
  });

  describe("Эквивалентное разбиение — определение категории из имени", () => {
    it("макрос !суп → categoryDetectedFromMacro = SOUP", async () => {
      const res = await api.post<{ data: { categoryDetectedFromMacro: string } }>(
        "/api/dishes/calculate-nutrition",
        calcBody({ name: "!суп Борщ" }),
      );

      expect(res.status).toBe(200);
      expect(
        (res.body as { data: { categoryDetectedFromMacro: string } }).data.categoryDetectedFromMacro,
      ).toBe("SOUP");
    });

    it("ЭР: без макроса в имени → categoryDetectedFromMacro = null", async () => {
      const res = await api.post<{ data: { categoryDetectedFromMacro: null } }>(
        "/api/dishes/calculate-nutrition",
        calcBody({ name: "Обычное название без макроса" }),
      );

      expect(res.status).toBe(200);
      expect(
        (res.body as { data: { categoryDetectedFromMacro: null } }).data.categoryDetectedFromMacro,
      ).toBeNull();
    });

    it("макрос удаляется из suggestedName", async () => {
      const res = await api.post<{ data: { suggestedName: string } }>(
        "/api/dishes/calculate-nutrition",
        calcBody({ name: "!суп Борщ украинский" }),
      );

      expect(res.status).toBe(200);
      expect(
        (res.body as { data: { suggestedName: string } }).data.suggestedName,
      ).toBe("Борщ украинский");
    });
  });

  describe("Эквивалентное разбиение — невалидный JSON и тело", () => {
    it("невалидный JSON → 400 INVALID_JSON", async () => {
      const res = await fetch(
        `${process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000"}/api/dishes/calculate-nutrition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{ not valid json",
        },
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toHaveProperty("error.code", "INVALID_JSON");
    });
  });
});

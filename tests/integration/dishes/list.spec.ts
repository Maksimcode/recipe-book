import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import {
  createDish,
  createProduct,
  deleteDish,
  deleteProduct,
} from "../helpers/fixtures";

describe("GET /api/dishes", () => {
  let productId: string;
  let saladDishId: string;
  let veganDishId: string;

  beforeAll(async () => {
    const product = await createProduct({
      name: "Продукт для листинга блюд",
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    productId = product.id;

    const salad = await createDish(productId, {
      name: "Тестовый салат",
      category: "SALAD",
      isVegan: true,
    });
    saladDishId = salad.id;

    const veganDish = await createDish(productId, {
      name: "Веганское блюдо",
      category: "SECOND",
      isVegan: true,
    });
    veganDishId = veganDish.id;
  });

  afterAll(async () => {
    await deleteDish(saladDishId);
    await deleteDish(veganDishId);
    await deleteProduct(productId);
  });

  describe("Эквивалентное разбиение — базовые сценарии", () => {
    it("возвращает 200 и массив блюд без фильтров", async () => {
      const res = await api.get<{ data: unknown[] }>("/api/dishes");

      expect(res.status).toBe(200);
      expect(Array.isArray((res.body as { data: unknown[] }).data)).toBe(true);
    });

    it("ЭР: search находит блюдо по части имени", async () => {
      const res = await api.get<{ data: { name: string }[] }>("/api/dishes?search=Тестовый");

      expect(res.status).toBe(200);
      const dishes = (res.body as { data: { name: string }[] }).data;
      expect(dishes.some((d) => d.name === "Тестовый салат")).toBe(true);
    });

    it("ЭР: search по несуществующему слову возвращает пустой массив", async () => {
      const res = await api.get<{ data: unknown[] }>(
        `/api/dishes?search=${encodeURIComponent("НесуществующееБлюдоXYZ")}`,
      );

      expect(res.status).toBe(200);
      expect((res.body as { data: unknown[] }).data).toHaveLength(0);
    });
  });

  describe("Эквивалентное разбиение — невалидные параметры", () => {
    it("возвращает 400 при невалидном category", async () => {
      const res = await api.get("/api/dishes?category=INVALID_CATEGORY");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });
  });
});

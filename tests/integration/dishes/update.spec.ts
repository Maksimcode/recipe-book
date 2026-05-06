import { afterEach, beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import {
  createDish,
  createProduct,
  deleteDish,
  deleteProduct,
} from "../helpers/fixtures";

describe("PATCH /api/dishes/:id", () => {
  let productId: string;
  let veganProductId: string;
  let nonVeganProductId: string;
  let dishId: string;

  beforeAll(async () => {
    const product = await createProduct({
      name: "Продукт для обновления блюда",
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    productId = product.id;

    const veganProduct = await createProduct({
      name: "Веганский продукт (PATCH)",
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    veganProductId = veganProduct.id;

    const nonVegan = await createProduct({
      name: "Невеганский продукт (PATCH)",
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

  beforeEach(async () => {
    const dish = await createDish(productId, { name: "Блюдо для обновления" });
    dishId = dish.id;
  });

  afterEach(async () => {
    await deleteDish(dishId).catch(() => {});
  });

  describe("Эквивалентное разбиение — валидные обновления", () => {
    it("обновляет name и возвращает 200", async () => {
      const res = await api.patch(`/api/dishes/${dishId}`, { name: "Новое имя блюда" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.name", "Новое имя блюда");
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при несуществующем id", async () => {
      const res = await api.patch("/api/dishes/nonexistent-dish-00000000", {
        name: "Новое имя",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });
  });

  describe("Эквивалентное разбиение/BVA — валидация", () => {
    it("возвращает 400 при name из 1 символа", async () => {
      const res = await api.patch(`/api/dishes/${dishId}`, { name: "А" });
      expect(res.status).toBe(400);
    });

    it("при portionSizeGrams = 0.001 возвращает 400 из-за БЖУ per100g", async () => {
      const res = await api.patch(`/api/dishes/${dishId}`, { portionSizeGrams: 0.001 });

      expect(res.status).toBe(400);
    });
  });
});

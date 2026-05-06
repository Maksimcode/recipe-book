import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import {
  createProduct,
  deleteDish,
  deleteProduct,
  VALID_DISH_PAYLOAD_FACTORY,
} from "../helpers/fixtures";

describe("POST /api/dishes", () => {
  let productId: string;
  let nonVeganProductId: string;
  const createdDishIds: string[] = [];

  beforeAll(async () => {
    const product = await createProduct({
      name: "Базовый продукт для блюд",
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    productId = product.id;

    const nonVegan = await createProduct({
      name: "Невеганский продукт",
      isVegan: false,
      isGlutenFree: false,
      isSugarFree: false,
    });
    nonVeganProductId = nonVegan.id;
  });

  afterAll(async () => {
    for (const id of createdDishIds) {
      await deleteDish(id);
    }
    await deleteProduct(productId);
    await deleteProduct(nonVeganProductId);
  });

  async function createDish(payload: unknown) {
    const res = await api.post<{ data: { id: string } }>("/api/dishes", payload);
    if (res.status === 201) {
      createdDishIds.push((res.body as { data: { id: string } }).data.id);
    }
    return res;
  }

  describe("ЭР — валидные данные", () => {
    it("создаёт блюдо при корректных данных и возвращает 201", async () => {
      const res = await createDish(VALID_DISH_PAYLOAD_FACTORY(productId));

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data.id");
      expect(res.body).toHaveProperty("data.name");
    });
  });

  describe("ЭР/BVA — валидация и бизнес-правила", () => {
    it("отклоняет name из 1 символа", async () => {
      const res = await createDish({ ...VALID_DISH_PAYLOAD_FACTORY(productId), name: "А" });
      expect(res.status).toBe(400);
    });

    it("возвращает 400 при ссылке на несуществующий productId", async () => {
      const res = await createDish({
        ...VALID_DISH_PAYLOAD_FACTORY(productId),
        ingredients: [{ productId: "nonexistent-product-id", grams: 100 }],
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });

    it("отклоняет 6 фотографий", async () => {
      const res = await createDish({
        ...VALID_DISH_PAYLOAD_FACTORY(productId),
        photos: ["/p1.jpg", "/p2.jpg", "/p3.jpg", "/p4.jpg", "/p5.jpg", "/p6.jpg"],
      });
      expect(res.status).toBe(400);
    });

    it("возвращает 400 при isVegan=true когда один из продуктов не веганский", async () => {
      const res = await createDish({
        ...VALID_DISH_PAYLOAD_FACTORY(productId),
        ingredients: [
          { productId, grams: 100 },
          { productId: nonVeganProductId, grams: 50 },
        ],
        isVegan: true,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });
  });

  describe("Эквивалентное разбиение — определение категории из названия", () => {
    it("возвращает 400 при отсутствии category и без макро в имени", async () => {
      const res = await createDish({
        ...VALID_DISH_PAYLOAD_FACTORY(productId),
        name: "Просто название",
        category: undefined,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
    });
  });

});

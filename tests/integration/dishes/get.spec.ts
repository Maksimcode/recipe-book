import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createDish, createProduct, deleteDish, deleteProduct } from "../helpers/fixtures";

describe("GET /api/dishes/:id", () => {
  let productId: string;
  let dishId: string;

  beforeAll(async () => {
    const product = await createProduct({ name: "Продукт для блюда (GET)" });
    productId = product.id;

    const dish = await createDish(productId, { name: "Блюдо для чтения" });
    dishId = dish.id;
  });

  afterAll(async () => {
    await deleteDish(dishId);
    await deleteProduct(productId);
  });

  describe("Эквивалентное разбиение — существующий ресурс", () => {
    it("возвращает 200 и данные блюда по существующему id", async () => {
      const res = await api.get<{ data: { id: string } }>(`/api/dishes/${dishId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.id", dishId);
    });

    it("включает массив ingredients с данными продукта", async () => {
      const res = await api.get<{ data: { ingredients: { product: { id: string } }[] } }>(
        `/api/dishes/${dishId}`,
      );

      expect(res.status).toBe(200);
      const ingredients = (
        res.body as { data: { ingredients: { product: { id: string } }[] } }
      ).data.ingredients;
      expect(ingredients.length).toBeGreaterThan(0);
      expect(ingredients[0].product.id).toBe(productId);
    });

    it("включает массив photos в ответ", async () => {
      const res = await api.get<{ data: { photos: unknown[] } }>(`/api/dishes/${dishId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray((res.body as { data: { photos: unknown[] } }).data.photos)).toBe(true);
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при несуществующем id", async () => {
      const res = await api.get("/api/dishes/nonexistent-dish-00000000");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });

    it("возвращает 404 при случайном id", async () => {
      const res = await api.get("/api/dishes/clzzzzzzz00000000000000001");

      expect(res.status).toBe(404);
    });
  });
});

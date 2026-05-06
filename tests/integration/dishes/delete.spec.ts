import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createDish, createProduct, deleteDish, deleteProduct } from "../helpers/fixtures";

describe("DELETE /api/dishes/:id", () => {
  let productId: string;

  beforeAll(async () => {
    const product = await createProduct({ name: "Продукт для удаления блюд" });
    productId = product.id;
  });

  afterAll(async () => {
    await deleteProduct(productId);
  });

  describe("Эквивалентное разбиение — успешное удаление", () => {
    it("удаляет блюдо и возвращает 200 с { deleted: true }", async () => {
      const dish = await createDish(productId, { name: "Блюдо к удалению" });

      const res = await api.delete(`/api/dishes/${dish.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.deleted", true);
      expect(res.body).toHaveProperty("data.id", dish.id);
    });

    it("после удаления GET возвращает 404", async () => {
      const dish = await createDish(productId, { name: "Блюдо к удалению 2" });
      await api.delete(`/api/dishes/${dish.id}`);

      const res = await api.get(`/api/dishes/${dish.id}`);

      expect(res.status).toBe(404);
    });

    it("удаление блюда не удаляет связанный продукт", async () => {
      const dish = await createDish(productId, { name: "Блюдо к удалению 3" });
      await api.delete(`/api/dishes/${dish.id}`);

      const productRes = await api.get(`/api/products/${productId}`);

      expect(productRes.status).toBe(200);
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при удалении несуществующего id", async () => {
      const res = await api.delete("/api/dishes/nonexistent-dish-00000000");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });
  });
});

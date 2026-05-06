import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import {
  createDish,
  createProduct,
  deleteDish,
  deleteProduct,
} from "../helpers/fixtures";

describe("DELETE /api/products/:id", () => {
  const orphanDishIds: string[] = [];
  const orphanProductIds: string[] = [];

  afterAll(async () => {
    for (const id of orphanDishIds) {
      await deleteDish(id);
    }
    for (const id of orphanProductIds) {
      await deleteProduct(id);
    }
  });

  describe("Эквивалентное разбиение — успешное удаление", () => {
    it("удаляет продукт и возвращает 200 с { deleted: true }", async () => {
      const product = await createProduct({ name: "Продукт к удалению" });

      const res = await api.delete(`/api/products/${product.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.deleted", true);
      expect(res.body).toHaveProperty("data.id", product.id);
    });

    it("после удаления GET возвращает 404", async () => {
      const product = await createProduct({ name: "Продукт к удалению 2" });
      await api.delete(`/api/products/${product.id}`);

      const res = await api.get(`/api/products/${product.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при удалении несуществующего id", async () => {
      const res = await api.delete("/api/products/nonexistent-id-00000000");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });
  });

  describe("Эквивалентное разбиение — продукт используется в блюде", () => {
    it("возвращает 409 PRODUCT_IN_USE если продукт включён в блюдо", async () => {
      const product = await createProduct({ name: "Продукт в блюде" });
      const dish = await createDish(product.id, { name: "Блюдо с продуктом", category: "SECOND" });

      orphanDishIds.push(dish.id);
      orphanProductIds.push(product.id);

      const res = await api.delete(`/api/products/${product.id}`);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error.code", "PRODUCT_IN_USE");
      expect(
        (res.body as { error: { dishes: { id: string }[] } }).error.dishes,
      ).toContainEqual(expect.objectContaining({ id: dish.id }));
    });
  });
});

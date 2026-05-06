import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createProduct, deleteProduct } from "../helpers/fixtures";

describe("GET /api/products/:id", () => {
  let existingProductId: string;

  beforeAll(async () => {
    const product = await createProduct({ name: "Продукт для чтения" });
    existingProductId = product.id;
  });

  afterAll(async () => {
    await deleteProduct(existingProductId);
  });

  describe("Эквивалентное разбиение — существующий ресурс", () => {
    it("возвращает 200 и данные продукта по существующему id", async () => {
      const res = await api.get<{ data: { id: string; name: string } }>(
        `/api/products/${existingProductId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.id", existingProductId);
      expect(res.body).toHaveProperty("data.name", "Продукт для чтения");
    });

    it("включает массив photos в ответ", async () => {
      const res = await api.get<{ data: { photos: unknown[] } }>(
        `/api/products/${existingProductId}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray((res.body as { data: { photos: unknown[] } }).data.photos)).toBe(true);
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при несуществующем id", async () => {
      const res = await api.get("/api/products/nonexistent-id-00000000");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });

    it("возвращает 404 при случайном uuid, которого нет в БД", async () => {
      const res = await api.get("/api/products/clzzzzzzz00000000000000000");

      expect(res.status).toBe(404);
    });
  });
});

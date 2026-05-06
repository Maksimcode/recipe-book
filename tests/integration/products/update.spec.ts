import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createProduct, deleteProduct } from "../helpers/fixtures";

describe("PATCH /api/products/:id", () => {
  let productId: string;

  beforeEach(async () => {
    const product = await createProduct({ name: "Продукт для обновления" });
    productId = product.id;
  });

  afterEach(async () => {
    await deleteProduct(productId).catch(() => {});
  });

  describe("Эквивалентное разбиение - валидные обновления", () => {
    it("обновляет name и возвращает 200", async () => {
      const res = await api.patch(`/api/products/${productId}`, { name: "Новое имя" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.name", "Новое имя");
    });
  });

  describe("Эквивалентное разбиение — несуществующий ресурс", () => {
    it("возвращает 404 при несуществующем id", async () => {
      const res = await api.patch("/api/products/nonexistent-id-00000000", {
        name: "Не важно",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error.code", "NOT_FOUND");
    });
  });

  describe("BVA — сумма БЖУ при обновлении", () => {
    it("отклоняет обновление, при котором сумма БЖУ > 100", async () => {
      const res = await api.patch(`/api/products/${productId}`, {
        proteinPer100g: 50,
        fatPer100g: 30,
        carbsPer100g: 30.001,
      });

      expect(res.status).toBe(400);
    });
  });
});

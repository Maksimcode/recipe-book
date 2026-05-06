import { afterAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { deleteProduct, VALID_PRODUCT_PAYLOAD } from "../helpers/fixtures";

describe("POST /api/products", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds) {
      await deleteProduct(id);
    }
  });

  async function createProduct(payload: unknown) {
    const res = await api.post("/api/products", payload);
    if (res.status === 201) {
      createdIds.push((res.body as { data: { id: string } }).data.id);
    }
    return res;
  }

  describe("Эквивалентное разбиение — валидные данные", () => {
    it("создаёт продукт при корректных минимальных данных", async () => {
      const res = await createProduct(VALID_PRODUCT_PAYLOAD);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data.id");
      expect(res.body).toHaveProperty("data.name", VALID_PRODUCT_PAYLOAD.name.trim());
    });

    it("создаёт продукт с булевыми флагами и фото", async () => {
      const res = await createProduct({
        ...VALID_PRODUCT_PAYLOAD,
        isVegan: true,
        photos: ["/uploads/photo1.jpg"],
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("data.isVegan", true);
      expect((res.body as unknown as { data: { photos: unknown[] } }).data.photos).toHaveLength(1);
    });
  });

  describe("BVA — поле name", () => {
    it("принимает name длиной 2", async () => {
      const res = await createProduct({ ...VALID_PRODUCT_PAYLOAD, name: "АБ" });

      expect(res.status).toBe(201);
    });

    it("отклоняет name длиной 1", async () => {
      const res = await createProduct({ ...VALID_PRODUCT_PAYLOAD, name: "А" });

      expect(res.status).toBe(400);
    });
  });

  describe("Эквивалентное разбиение/BVA — валидация", () => {
    it("отклоняет сумму БЖУ > 100", async () => {
      const res = await createProduct({
        ...VALID_PRODUCT_PAYLOAD,
        proteinPer100g: 40,
        fatPer100g: 30,
        carbsPer100g: 30.001,
      });

      expect(res.status).toBe(400);
    });

    it("отклоняет 6 фотографий", async () => {
      const res = await createProduct({
        ...VALID_PRODUCT_PAYLOAD,
        photos: ["/p1.jpg", "/p2.jpg", "/p3.jpg", "/p4.jpg", "/p5.jpg", "/p6.jpg"],
      });

      expect(res.status).toBe(400);
    });
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api } from "../helpers/api";
import { createProduct, deleteProduct } from "../helpers/fixtures";

describe("GET /api/products", () => {
  let veganProductId: string;
  let frozenProductId: string;
  let sortAId: string;
  let sortZId: string;
  const sortAName = "AAA_sort_probe_product";
  const sortZName = "ZZZ_sort_probe_product";

  beforeAll(async () => {
    const vegan = await createProduct({
      name: "Листья салата",
      category: "GREENS",
      isVegan: true,
      isGlutenFree: true,
      isSugarFree: true,
    });
    veganProductId = vegan.id;

    const frozen = await createProduct({
      name: "Замороженные овощи",
      category: "FROZEN",
      isVegan: true,
      isGlutenFree: false,
    });
    frozenProductId = frozen.id;

    const sortA = await createProduct({ name: sortAName });
    sortAId = sortA.id;
    const sortZ = await createProduct({ name: sortZName });
    sortZId = sortZ.id;
  });

  afterAll(async () => {
    await deleteProduct(veganProductId);
    await deleteProduct(frozenProductId);
    await deleteProduct(sortAId);
    await deleteProduct(sortZId);
  });

  describe("Эквивалентное разбиение — базовые сценарии", () => {
    it("возвращает 200 и массив продуктов без фильтров", async () => {
      const res = await api.get<{ data: unknown[] }>("/api/products");

      expect(res.status).toBe(200);
      expect(Array.isArray((res.body as { data: unknown[] }).data)).toBe(true);
    });

    it("ЭР: search находит продукт по точному совпадению части имени", async () => {
      const res = await api.get<{ data: { name: string }[] }>(
        "/api/products?search=Листья",
      );

      expect(res.status).toBe(200);
      const products = (res.body as { data: { name: string }[] }).data;
      expect(products.some((p) => p.name === "Листья салата")).toBe(true);
    });

    it("ЭР: search по несуществующему слову возвращает пустой массив", async () => {
      const res = await api.get<{ data: unknown[] }>(
        `/api/products?search=${encodeURIComponent("НесуществующийПродуктXYZ")}`,
      );

      expect(res.status).toBe(200);
      expect((res.body as { data: unknown[] }).data).toHaveLength(0);
    });

    it("игнорирует пустой search и возвращает все продукты", async () => {
      const withEmpty = await api.get<{ data: { id: string }[] }>("/api/products?search=");
      expect(withEmpty.status).toBe(200);
      const ids = (withEmpty.body as { data: { id: string }[] }).data.map((p) => p.id);
      expect(ids).toContain(veganProductId);
    });
  });

  describe("Эквивалентное разбиение — невалидные параметры", () => {
    it("возвращает 400 при невалидном sortBy", async () => {
      const res = await api.get("/api/products?sortBy=invalid");

      expect(res.status).toBe(400);
    });
  });

  describe("Эквивалентное разбиение — сортировка", () => {
    it("сортирует по name asc — AAA идёт раньше ZZZ", async () => {
      const res = await api.get<{ data: { name: string }[] }>(
        "/api/products?sortBy=name&sortOrder=asc",
      );

      expect(res.status).toBe(200);
      const names = (res.body as { data: { name: string }[] }).data.map((p) => p.name);
      const idxA = names.indexOf(sortAName);
      const idxZ = names.indexOf(sortZName);
      expect(idxA).toBeGreaterThanOrEqual(0);
      expect(idxZ).toBeGreaterThanOrEqual(0);
      expect(idxA).toBeLessThan(idxZ);
    });
  });
});

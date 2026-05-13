import type { APIRequestContext } from "@playwright/test";

import { VALID_PRODUCT_API_BODY } from "./fixtures";

export type CreatedProduct = { id: string; name: string };
export type CreatedDish = { id: string; name: string };

export async function apiCreateProduct(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
): Promise<CreatedProduct> {
  const res = await request.post("/api/products", {
    data: { ...VALID_PRODUCT_API_BODY, ...overrides },
  });
  if (!res.ok()) {
    throw new Error(`POST /api/products failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { data: CreatedProduct };
  return json.data;
}

export async function apiDeleteProduct(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/products/${id}`);
}

export async function apiCreateDish(
  request: APIRequestContext,
  productId: string,
  overrides: Record<string, unknown> = {},
): Promise<CreatedDish> {
  const res = await request.post("/api/dishes", {
    data: {
      name: "Тестовое блюдо API",
      photos: [],
      ingredients: [{ productId, grams: 200 }],
      portionSizeGrams: 200,
      category: "SECOND",
      ...overrides,
    },
  });
  if (!res.ok()) {
    throw new Error(`POST /api/dishes failed: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as { data: CreatedDish };
  return json.data;
}

export async function apiDeleteDish(request: APIRequestContext, id: string): Promise<void> {
  await request.delete(`/api/dishes/${id}`);
}

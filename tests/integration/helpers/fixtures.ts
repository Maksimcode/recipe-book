import { api } from "./api";

export type CreatedProduct = {
  id: string;
  name: string;
};

export type CreatedDish = {
  id: string;
  name: string;
};

export const VALID_PRODUCT_PAYLOAD = {
  name: "Тестовый продукт",
  caloriesPer100g: 100,
  proteinPer100g: 10,
  fatPer100g: 5,
  carbsPer100g: 20,
  category: "GRAINS",
  cookingState: "READY_TO_EAT",
};

export const VALID_DISH_PAYLOAD_FACTORY = (productId: string) => ({
  name: "Тестовое блюдо",
  photos: [],
  ingredients: [{ productId, grams: 200 }],
  portionSizeGrams: 200,
  category: "SECOND",
});

export async function createProduct(
  overrides: Record<string, unknown> = {},
): Promise<CreatedProduct> {
  const res = await api.post<{ data: CreatedProduct }>("/api/products", {
    ...VALID_PRODUCT_PAYLOAD,
    ...overrides,
  });

  if (res.status !== 201) {
    throw new Error(
      `Fixture createProduct failed: HTTP ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }

  return (res.body as { data: CreatedProduct }).data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/api/products/${id}`);
}

export async function createDish(
  productId: string,
  overrides: Record<string, unknown> = {},
): Promise<CreatedDish> {
  const res = await api.post<{ data: CreatedDish }>("/api/dishes", {
    ...VALID_DISH_PAYLOAD_FACTORY(productId),
    ...overrides,
  });

  if (res.status !== 201) {
    throw new Error(
      `Fixture createDish failed: HTTP ${res.status} — ${JSON.stringify(res.body)}`,
    );
  }

  return (res.body as { data: CreatedDish }).data;
}

export async function deleteDish(id: string): Promise<void> {
  await api.delete(`/api/dishes/${id}`);
}

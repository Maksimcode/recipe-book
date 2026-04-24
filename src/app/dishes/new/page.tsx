"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DishForm } from "@/components/forms/DishForm";
import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import type { DishDto, ProductShortDto } from "@/lib/frontend/dish-options";
import type { ProductDto } from "@/lib/frontend/product-options";

export default function NewDishPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductShortDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ProductDto[]>("/api/products?sortBy=name&sortOrder=asc");
        setProducts(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            isSugarFree: item.isSugarFree,
          })),
        );
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Не удалось загрузить продукты.");
      } finally {
        setLoading(false);
      }
    }
    void loadProducts();
  }, []);

  function onSuccess(dish: DishDto) {
    router.push(`/dishes/${dish.id}`);
  }

  return (
    <main className="container">
      <h1>Новое блюдо</h1>
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {!loading && !error ? (
        <div className="panel">
          <DishForm mode="create" products={products} onSuccess={onSuccess} />
        </div>
      ) : null}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DishForm } from "@/components/forms/DishForm";
import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import type { DishDto, ProductShortDto } from "@/lib/frontend/dish-options";
import type { ProductDto } from "@/lib/frontend/product-options";

export default function EditDishPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [dish, setDish] = useState<DishDto | null>(null);
  const [products, setProducts] = useState<ProductShortDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dishData, productsData] = await Promise.all([
          apiRequest<DishDto>(`/api/dishes/${params.id}`),
          apiRequest<ProductDto[]>("/api/products?sortBy=name&sortOrder=asc"),
        ]);

        setDish(dishData);
        setProducts(
          productsData.map((item) => ({
            id: item.id,
            name: item.name,
            isVegan: item.isVegan,
            isGlutenFree: item.isGlutenFree,
            isSugarFree: item.isSugarFree,
          })),
        );
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Не удалось загрузить данные.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  function onSuccess(updated: DishDto) {
    router.push(`/dishes/${updated.id}`);
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>Редактирование блюда</h1>
        <Link className="btn-secondary" href={`/dishes/${params.id}`}>
          ← Назад
        </Link>
      </div>
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {!loading && !error && dish ? (
        <div className="panel">
          <DishForm mode="edit" initial={dish} products={products} onSuccess={onSuccess} />
        </div>
      ) : null}
    </main>
  );
}

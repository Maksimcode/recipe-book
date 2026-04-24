"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductForm } from "@/components/forms/ProductForm";
import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import type { ProductDto } from "@/lib/frontend/product-options";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ProductDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ProductDto>(`/api/products/${params.id}`);
        setItem(data);
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Не удалось загрузить продукт.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  function onSuccess(product: ProductDto) {
    router.push(`/products/${product.id}`);
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>Редактирование продукта</h1>
        <Link className="btn-secondary" href={`/products/${params.id}`}>
          ← Назад
        </Link>
      </div>
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {item ? (
        <div className="panel">
          <ProductForm mode="edit" initial={item} onSuccess={onSuccess} />
        </div>
      ) : null}
    </main>
  );
}

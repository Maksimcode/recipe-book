"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/forms/ProductForm";
import type { ProductDto } from "@/lib/frontend/product-options";

export default function NewProductPage() {
  const router = useRouter();

  function onSuccess(product: ProductDto) {
    router.push(`/products/${product.id}`);
  }

  return (
    <main className="container">
      <h1>Новый продукт</h1>
      <div className="panel">
        <ProductForm mode="create" onSuccess={onSuccess} />
      </div>
    </main>
  );
}

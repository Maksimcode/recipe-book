"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import { formatNumber } from "@/lib/frontend/format-number";
import {
  getCategoryLabel,
  getCookingStateLabel,
  productCategoryOptions,
  productCookingStateOptions,
  type ProductDto,
} from "@/lib/frontend/product-options";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";

type SortBy = "name" | "calories" | "protein" | "fat" | "carbs";

export default function ProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cookingState, setCookingState] = useState("");
  const [isVegan, setIsVegan] = useState("");
  const [isGlutenFree, setIsGlutenFree] = useState("");
  const [isSugarFree, setIsSugarFree] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [reloadNonce, setReloadNonce] = useState(0);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (cookingState) params.set("cookingState", cookingState);
      if (isVegan) params.set("isVegan", isVegan);
      if (isGlutenFree) params.set("isGlutenFree", isGlutenFree);
      if (isSugarFree) params.set("isSugarFree", isSugarFree);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const data = await apiRequest<ProductDto[]>(`/api/products?${params.toString()}`);
      setItems(data);
    } catch (e) {
      if (e instanceof ApiClientError) setError(e.message);
      else setError("Не удалось загрузить список продуктов.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, cookingState, isVegan, isGlutenFree, isSugarFree, sortBy, sortOrder, reloadNonce]);

  function onResetFilters() {
    setSearch("");
    setCategory("");
    setCookingState("");
    setIsVegan("");
    setIsGlutenFree("");
    setIsSugarFree("");
    setSortBy("name");
    setSortOrder("asc");
    setReloadNonce((value) => value + 1);
  }

  async function onDelete(id: string) {
    if (!confirm("Удалить продукт?")) return;
    try {
      await apiRequest<{ deleted: true; id: string }>(`/api/products/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "PRODUCT_IN_USE") {
        const dishNames = e.details?.dishes?.map((d) => d.name).join(", ") ?? "";
        alert(`Нельзя удалить продукт. Используется в блюдах: ${dishNames}`);
        return;
      }
      alert(e instanceof Error ? e.message : "Не удалось удалить продукт.");
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>Продукты</h1>
        <Link className="btn-primary" href="/products/new">
          + Новый продукт
        </Link>
      </div>

      <div className="panel grid-3">
        <input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-secondary" onClick={() => void load()}>
          Искать
        </button>
        <button className="btn-secondary" onClick={onResetFilters}>
          Сбросить фильтры
        </button>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {productCategoryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select value={cookingState} onChange={(e) => setCookingState(e.target.value)}>
          <option value="">Любая готовность</option>
          {productCookingStateOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
          <option value="name">Сортировка: название</option>
          <option value="calories">Сортировка: калорийность</option>
          <option value="protein">Сортировка: белки</option>
          <option value="fat">Сортировка: жиры</option>
          <option value="carbs">Сортировка: углеводы</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>

        <select value={isVegan} onChange={(e) => setIsVegan(e.target.value)}>
          <option value="">Веган: любой</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
        <select value={isGlutenFree} onChange={(e) => setIsGlutenFree(e.target.value)}>
          <option value="">Без глютена: любой</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
        <select value={isSugarFree} onChange={(e) => setIsSugarFree(e.target.value)}>
          <option value="">Без сахара: любой</option>
          <option value="true">Да</option>
          <option value="false">Нет</option>
        </select>
      </div>

      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="panel">
          <p>Ничего не найдено. Измени фильтры или создай новый продукт.</p>
        </div>
      ) : null}

      <div className="list cards-grid">
        {items.map((item) => (
          <article
            className="card card-clickable"
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/products/${item.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/products/${item.id}`);
              }
            }}
          >
            <PhotoCarousel photos={item.photos} alt={item.name} />
            <h3>{item.name}</h3>
            <p className="text-muted">
              {getCategoryLabel(item.category)} • {getCookingStateLabel(item.cookingState)}
            </p>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-label">Ккал</div>
                <div className="stat-value">{formatNumber(item.caloriesPer100g)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Белки</div>
                <div className="stat-value">{formatNumber(item.proteinPer100g)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Жиры</div>
                <div className="stat-value">{formatNumber(item.fatPer100g)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Углеводы</div>
                <div className="stat-value">{formatNumber(item.carbsPer100g)}</div>
              </div>
            </div>
            <div className="chips-row">
              {item.isVegan ? <span className="chip chip-flag chip-vegan">Веган</span> : null}
              {item.isGlutenFree ? (
                <span className="chip chip-flag chip-gluten">Без глютена</span>
              ) : null}
              {item.isSugarFree ? <span className="chip chip-flag chip-sugar">Без сахара</span> : null}
            </div>
            <div className="action-row">
              <Link
                className="icon-btn"
                href={`/products/${item.id}/edit`}
                aria-label="Редактировать"
                title="Редактировать"
                onClick={(event) => event.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
                  <path
                    d="M4 20h4l10-10a2.12 2.12 0 0 0-3-3L5 17v3z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 6.5l3 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <button
                className="icon-btn icon-btn-danger"
                aria-label="Удалить"
                title="Удалить"
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(item.id);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-svg">
                  <path
                    d="M3 6h18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6V4h8v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 6l-1 14H6L5 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 11v6M14 11v6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import {
  dishCategoryOptions,
  getDishCategoryLabel,
  getDishPer100gNutrition,
  type DishDto,
} from "@/lib/frontend/dish-options";
import { PhotoCarousel } from "@/components/ui/PhotoCarousel";

export default function DishesPage() {
  const router = useRouter();
  const [items, setItems] = useState<DishDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isVegan, setIsVegan] = useState("");
  const [isGlutenFree, setIsGlutenFree] = useState("");
  const [isSugarFree, setIsSugarFree] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (isVegan) params.set("isVegan", isVegan);
      if (isGlutenFree) params.set("isGlutenFree", isGlutenFree);
      if (isSugarFree) params.set("isSugarFree", isSugarFree);
      const data = await apiRequest<DishDto[]>(`/api/dishes?${params.toString()}`);
      setItems(data);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Не удалось загрузить список блюд.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, isVegan, isGlutenFree, isSugarFree, reloadNonce]);

  function onResetFilters() {
    setSearch("");
    setCategory("");
    setIsVegan("");
    setIsGlutenFree("");
    setIsSugarFree("");
    setReloadNonce((value) => value + 1);
  }

  async function onDelete(id: string) {
    if (!confirm("Удалить блюдо?")) return;
    try {
      await apiRequest<{ deleted: true; id: string }>(`/api/dishes/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить блюдо.");
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1>Блюда</h1>
        <Link className="btn-primary" href="/dishes/new">
          + Новое блюдо
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
          {dishCategoryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
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
          <p>Ничего не найдено. Измени фильтры или создай новое блюдо.</p>
        </div>
      ) : null}

      <div className="list cards-grid">
        {items.map((item) => {
          const per100g = getDishPer100gNutrition({
            caloriesPerPortion: item.caloriesPerPortion,
            proteinPerPortion: item.proteinPerPortion,
            fatPerPortion: item.fatPerPortion,
            carbsPerPortion: item.carbsPerPortion,
            portionSizeGrams: item.portionSizeGrams,
          });

          return (
            <article
              className="card card-clickable"
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dishes/${item.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/dishes/${item.id}`);
                }
              }}
            >
              <PhotoCarousel photos={item.photos} alt={item.name} />
              <h3>{item.name}</h3>
              <p className="text-muted">{getDishCategoryLabel(item.category)}</p>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-label">Ккал</div>
                  <div className="stat-value">{item.caloriesPerPortion}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Белки</div>
                  <div className="stat-value">{item.proteinPerPortion}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Жиры</div>
                  <div className="stat-value">{item.fatPerPortion}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Углеводы</div>
                  <div className="stat-value">{item.carbsPerPortion}</div>
                </div>
              </div>
              <p className="text-muted">На 100 г:</p>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-label">Ккал</div>
                  <div className="stat-value">{per100g.caloriesPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Белки</div>
                  <div className="stat-value">{per100g.proteinPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Жиры</div>
                  <div className="stat-value">{per100g.fatPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Углеводы</div>
                  <div className="stat-value">{per100g.carbsPer100g}</div>
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
                  href={`/dishes/${item.id}/edit`}
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
          );
        })}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import {
  getDishCategoryLabel,
  getDishPer100gNutrition,
  type DishDto,
} from "@/lib/frontend/dish-options";

export default function DishDetailsPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<DishDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<DishDto>(`/api/dishes/${params.id}`);
        setItem(data);
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Не удалось загрузить блюдо.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  const per100g = item
    ? getDishPer100gNutrition({
        caloriesPerPortion: item.caloriesPerPortion,
        proteinPerPortion: item.proteinPerPortion,
        fatPerPortion: item.fatPerPortion,
        carbsPerPortion: item.carbsPerPortion,
        portionSizeGrams: item.portionSizeGrams,
      })
    : null;

  return (
    <main className="container">
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {item ? (
        <article className="panel">
          <div className="page-head">
            <h1>{item.name}</h1>
            <div className="row">
              <Link className="btn-secondary" href="/dishes">
                ← К списку
              </Link>
              <Link className="btn-secondary" href={`/dishes/${item.id}/edit`}>
                Редактировать
              </Link>
            </div>
          </div>

          <div className="details-layout">
            <section className="details-gallery">
              {item.photos[0]?.photoUrl ? (
                <img className="details-main-photo" src={item.photos[0].photoUrl} alt={item.name} />
              ) : (
                <div className="details-main-photo details-photo-empty">Фото отсутствует</div>
              )}
              {item.photos.length > 1 ? (
                <div className="details-thumbs">
                  {item.photos.slice(1).map((photo) => (
                    <img key={photo.id} src={photo.photoUrl} alt={item.name} />
                  ))}
                </div>
              ) : null}
            </section>

            <section className="details-meta">
              <p className="text-muted">{getDishCategoryLabel(item.category)}</p>
              <p>Размер порции: {item.portionSizeGrams} г</p>
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
              <p>На 100 г:</p>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-label">Ккал</div>
                  <div className="stat-value">{per100g?.caloriesPer100g ?? 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Белки</div>
                  <div className="stat-value">{per100g?.proteinPer100g ?? 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Жиры</div>
                  <div className="stat-value">{per100g?.fatPer100g ?? 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Углеводы</div>
                  <div className="stat-value">{per100g?.carbsPer100g ?? 0}</div>
                </div>
              </div>
              <div className="chips-row">
                {item.isVegan ? <span className="chip chip-flag chip-vegan">Веган</span> : null}
                {item.isGlutenFree ? <span className="chip chip-flag chip-gluten">Без глютена</span> : null}
                {item.isSugarFree ? <span className="chip chip-flag chip-sugar">Без сахара</span> : null}
              </div>
            </section>
          </div>

          <section className="details-section">
            <h3>Состав блюда</h3>
            <div className="ingredient-list">
              {item.ingredients.map((ingredient) => (
                <article key={ingredient.id} className="ingredient-item">
                  <strong>{ingredient.product?.name ?? ingredient.productId}</strong>
                  <span className="text-muted">{ingredient.grams} г</span>
                </article>
              ))}
            </div>
          </section>
        </article>
      ) : null}
    </main>
  );
}

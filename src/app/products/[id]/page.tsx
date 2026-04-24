"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import {
  getCategoryLabel,
  getCookingStateLabel,
  type ProductDto,
} from "@/lib/frontend/product-options";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
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

  return (
    <main className="container">
      {loading ? <p>Загрузка...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}
      {item ? (
        <article className="panel">
          <div className="page-head">
            <h1>{item.name}</h1>
            <div className="row">
              <Link className="btn-secondary" href="/products">
                ← К списку
              </Link>
              <Link className="btn-secondary" href={`/products/${item.id}/edit`}>
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
              <p className="text-muted">
                {getCategoryLabel(item.category)} • {getCookingStateLabel(item.cookingState)}
              </p>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-label">Ккал</div>
                  <div className="stat-value">{item.caloriesPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Белки</div>
                  <div className="stat-value">{item.proteinPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Жиры</div>
                  <div className="stat-value">{item.fatPer100g}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Углеводы</div>
                  <div className="stat-value">{item.carbsPer100g}</div>
                </div>
              </div>
              <div className="meta-block">
                <p>Состав: {item.ingredientsComposition ?? "—"}</p>
                <div className="chips-row">
                  {item.isVegan ? <span className="chip chip-flag chip-vegan">Веган</span> : null}
                  {item.isGlutenFree ? (
                    <span className="chip chip-flag chip-gluten">Без глютена</span>
                  ) : null}
                  {item.isSugarFree ? (
                    <span className="chip chip-flag chip-sugar">Без сахара</span>
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <section className="details-section">
            <h3>Все фотографии ({item.photos.length})</h3>
            {item.photos.length > 0 ? (
              <div className="photo-grid">
                {item.photos.map((photo) => (
                  <img key={photo.id} src={photo.photoUrl} alt={item.name} />
                ))}
              </div>
            ) : (
              <p className="text-muted">Фотографии пока не добавлены.</p>
            )}
          </section>
        </article>
      ) : null}
    </main>
  );
}

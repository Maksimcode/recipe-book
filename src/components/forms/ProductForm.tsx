"use client";

import { useMemo, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import { uploadImage } from "@/lib/frontend/upload-image";
import {
  productCategoryOptions,
  productCookingStateOptions,
  type ProductDto,
} from "@/lib/frontend/product-options";

type ProductFormProps = {
  mode: "create" | "edit";
  initial?: ProductDto;
  onSuccess: (product: ProductDto) => void;
};

function toPhotosText(photos: ProductDto["photos"] | undefined): string {
  if (!photos || photos.length === 0) {
    return "";
  }
  return photos.map((item) => item.photoUrl).join("\n");
}

export function ProductForm({ mode, initial, onSuccess }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [photosText, setPhotosText] = useState(toPhotosText(initial?.photos));
  const [caloriesPer100g, setCaloriesPer100g] = useState(String(initial?.caloriesPer100g ?? 0));
  const [proteinPer100g, setProteinPer100g] = useState(String(initial?.proteinPer100g ?? 0));
  const [fatPer100g, setFatPer100g] = useState(String(initial?.fatPer100g ?? 0));
  const [carbsPer100g, setCarbsPer100g] = useState(String(initial?.carbsPer100g ?? 0));
  const [ingredientsComposition, setIngredientsComposition] = useState(
    initial?.ingredientsComposition ?? "",
  );
  const [category, setCategory] = useState(
    initial?.category ?? productCategoryOptions[0].value,
  );
  const [cookingState, setCookingState] = useState(
    initial?.cookingState ?? productCookingStateOptions[0].value,
  );
  const [isVegan, setIsVegan] = useState(initial?.isVegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(initial?.isGlutenFree ?? false);
  const [isSugarFree, setIsSugarFree] = useState(initial?.isSugarFree ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bjuSum = useMemo(() => {
    const p = Number(proteinPer100g) || 0;
    const f = Number(fatPer100g) || 0;
    const c = Number(carbsPer100g) || 0;
    return p + f + c;
  }, [proteinPer100g, fatPer100g, carbsPer100g]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const photos = photosText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (photos.length > 5) {
      setError("Можно указать не более 5 фотографий.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Название должно быть не короче 2 символов.");
      return;
    }
    if (bjuSum > 100) {
      setError("Сумма БЖУ должна быть не больше 100.");
      return;
    }

    const payload = {
      name,
      photos,
      caloriesPer100g: Number(caloriesPer100g),
      proteinPer100g: Number(proteinPer100g),
      fatPer100g: Number(fatPer100g),
      carbsPer100g: Number(carbsPer100g),
      ingredientsComposition: ingredientsComposition.trim().length > 0 ? ingredientsComposition : null,
      category,
      cookingState,
      isVegan,
      isGlutenFree,
      isSugarFree,
    };

    setSaving(true);
    try {
      const product = await apiRequest<ProductDto>(
        mode === "create" ? "/api/products" : `/api/products/${initial?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      onSuccess(product);
    } catch (e) {
      if (e instanceof ApiClientError) {
        setError(e.message);
      } else {
        setError("Не удалось сохранить продукт.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    const existing = photosText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (existing.length + files.length > 5) {
      setError("Можно указать не более 5 фотографий.");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file)));
      const next = [...existing, ...uploadedUrls];
      setPhotosText(next.join("\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить изображение.");
    } finally {
      setUploading(false);
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    await uploadFiles(files);
  }

  async function onPastePhotos(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (imageFiles.length === 0) return;
    event.preventDefault();
    await uploadFiles(imageFiles);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="product-form-name">Название</label>
        <input
          id="product-form-name"
          value={name}
          minLength={2}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="product-form-photo-urls">
          Фотографии (вставка из буфера, файл с компьютера, либо ссылки)
        </label>
        <div className="row">
          <input
            id="product-form-photo-file"
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            disabled={uploading || saving}
          />
          <span className="text-muted">{uploading ? "Загружаем фото..." : "До 5 файлов"}</span>
        </div>
        <textarea
          id="product-form-photo-urls"
          rows={4}
          value={photosText}
          onChange={(e) => setPhotosText(e.target.value)}
          onPaste={onPastePhotos}
          placeholder="https://example.com/photo-1.jpg"
        />
        {photosText.trim() ? (
          <div className="photo-grid">
            {photosText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt={`Фото продукта ${index + 1}`} />
              ))}
          </div>
        ) : null}
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="product-form-calories">Калорийность, ккал/100г</label>
          <input
            id="product-form-calories"
            type="number"
            min={0}
            step="0.01"
            required
            value={caloriesPer100g}
            onChange={(e) => setCaloriesPer100g(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="product-form-protein">Белки, г/100г</label>
          <input
            id="product-form-protein"
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            value={proteinPer100g}
            onChange={(e) => setProteinPer100g(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="product-form-fat">Жиры, г/100г</label>
          <input
            id="product-form-fat"
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            value={fatPer100g}
            onChange={(e) => setFatPer100g(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="product-form-carbs">Углеводы, г/100г</label>
          <input
            id="product-form-carbs"
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            value={carbsPer100g}
            onChange={(e) => setCarbsPer100g(e.target.value)}
          />
        </div>
      </div>

      <p className={bjuSum > 100 ? "text-error" : "text-muted"}>Сумма БЖУ: {bjuSum.toFixed(2)}</p>

      <div className="field">
        <label htmlFor="product-form-composition">Состав (опционально)</label>
        <textarea
          id="product-form-composition"
          rows={3}
          value={ingredientsComposition}
          onChange={(e) => setIngredientsComposition(e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="product-form-category">Категория</label>
          <select
            id="product-form-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            {productCategoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="product-form-cooking">Готовность</label>
          <select
            id="product-form-cooking"
            value={cookingState}
            onChange={(e) => setCookingState(e.target.value as typeof cookingState)}
          >
            {productCookingStateOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flags-row">
        <label>
          <input type="checkbox" checked={isVegan} onChange={(e) => setIsVegan(e.target.checked)} />
          Веган
        </label>
        <label>
          <input
            type="checkbox"
            checked={isGlutenFree}
            onChange={(e) => setIsGlutenFree(e.target.checked)}
          />
          Без глютена
        </label>
        <label>
          <input
            type="checkbox"
            checked={isSugarFree}
            onChange={(e) => setIsSugarFree(e.target.checked)}
          />
          Без сахара
        </label>
      </div>

      {error ? <p className="text-error">{error}</p> : null}
      {!error ? (
        <p className="text-muted">
          После сохранения можно вернуться к списку и проверить фильтры/поиск.
        </p>
      ) : null}

      <button className="btn-primary" type="submit" disabled={saving || bjuSum > 100}>
        {saving ? "Сохраняем..." : mode === "create" ? "Создать продукт" : "Сохранить изменения"}
      </button>
    </form>
  );
}

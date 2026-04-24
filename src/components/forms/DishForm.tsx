"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiClientError, apiRequest } from "@/lib/frontend/api";
import { uploadImage } from "@/lib/frontend/upload-image";
import {
  dishCategoryOptions,
  getDishPer100gNutrition,
  type DishDto,
  type ProductShortDto,
} from "@/lib/frontend/dish-options";
import { DishIngredientsEditor, type IngredientState } from "@/components/forms/DishIngredientsEditor";

type DishFormProps = {
  mode: "create" | "edit";
  initial?: DishDto;
  products: ProductShortDto[];
  onSuccess: (dish: DishDto) => void;
};

function photosToText(photos: DishDto["photos"] | undefined): string {
  if (!photos || photos.length === 0) return "";
  return photos.map((item) => item.photoUrl).join("\n");
}

export function DishForm({ mode, initial, products, onSuccess }: DishFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [photosText, setPhotosText] = useState(photosToText(initial?.photos));
  const [portionSizeGrams, setPortionSizeGrams] = useState(String(initial?.portionSizeGrams ?? 0));
  const [category, setCategory] = useState(initial?.category ?? "");
  const [isVegan, setIsVegan] = useState(initial?.isVegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(initial?.isGlutenFree ?? false);
  const [isSugarFree, setIsSugarFree] = useState(initial?.isSugarFree ?? false);
  const [caloriesPerPortion, setCaloriesPerPortion] = useState(
    String(initial?.caloriesPerPortion ?? 0),
  );
  const [proteinPerPortion, setProteinPerPortion] = useState(String(initial?.proteinPerPortion ?? 0));
  const [fatPerPortion, setFatPerPortion] = useState(String(initial?.fatPerPortion ?? 0));
  const [carbsPerPortion, setCarbsPerPortion] = useState(String(initial?.carbsPerPortion ?? 0));
  const [isNutritionManuallyEdited, setIsNutritionManuallyEdited] = useState(
    initial?.isNutritionManuallyEdited ?? false,
  );
  const [ingredients, setIngredients] = useState<IngredientState[]>(
    initial?.ingredients?.length
      ? initial.ingredients.map((item) => ({ productId: item.productId, grams: String(item.grams) }))
      : [{ productId: "", grams: "" }],
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [calcInfo, setCalcInfo] = useState<{
    isVegan: boolean;
    isGlutenFree: boolean;
    isSugarFree: boolean;
    macroCategory: string | null;
  } | null>(null);

  const parsedIngredients = useMemo(
    () =>
      ingredients
        .map((item) => ({ productId: item.productId, grams: Number(item.grams) }))
        .filter((item) => item.productId && Number.isFinite(item.grams) && item.grams > 0),
    [ingredients],
  );

  const per100gPreview = useMemo(
    () =>
      getDishPer100gNutrition({
        caloriesPerPortion: Number(caloriesPerPortion) || 0,
        proteinPerPortion: Number(proteinPerPortion) || 0,
        fatPerPortion: Number(fatPerPortion) || 0,
        carbsPerPortion: Number(carbsPerPortion) || 0,
        portionSizeGrams: Number(portionSizeGrams) || 0,
      }),
    [caloriesPerPortion, proteinPerPortion, fatPerPortion, carbsPerPortion, portionSizeGrams],
  );

  useEffect(() => {
    async function calculate() {
      if (parsedIngredients.length === 0 || Number(portionSizeGrams) <= 0) return;
      try {
        const data = await apiRequest<{
          autoNutrition: {
            caloriesPerPortion: number;
            proteinPerPortion: number;
            fatPerPortion: number;
            carbsPerPortion: number;
          };
          flagsAvailability: { isVegan: boolean; isGlutenFree: boolean; isSugarFree: boolean };
          categoryDetectedFromMacro: string | null;
        }>("/api/dishes/calculate-nutrition", {
          method: "POST",
          body: JSON.stringify({
            name,
            ingredients: parsedIngredients,
            portionSizeGrams: Number(portionSizeGrams),
          }),
        });

        if (!isNutritionManuallyEdited) {
          setCaloriesPerPortion(String(data.autoNutrition.caloriesPerPortion));
          setProteinPerPortion(String(data.autoNutrition.proteinPerPortion));
          setFatPerPortion(String(data.autoNutrition.fatPerPortion));
          setCarbsPerPortion(String(data.autoNutrition.carbsPerPortion));
        }

        setCalcInfo({
          isVegan: data.flagsAvailability.isVegan,
          isGlutenFree: data.flagsAvailability.isGlutenFree,
          isSugarFree: data.flagsAvailability.isSugarFree,
          macroCategory: data.categoryDetectedFromMacro,
        });
      } catch {
        // ignore background calculation errors here
      }
    }

    void calculate();
  }, [parsedIngredients, portionSizeGrams, name, isNutritionManuallyEdited]);

  useEffect(() => {
    if (!calcInfo) return;
    if (!calcInfo.isVegan && isVegan) setIsVegan(false);
    if (!calcInfo.isGlutenFree && isGlutenFree) setIsGlutenFree(false);
    if (!calcInfo.isSugarFree && isSugarFree) setIsSugarFree(false);
  }, [calcInfo, isVegan, isGlutenFree, isSugarFree]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const photos = photosText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (name.trim().length < 2) {
      setError("Название должно быть не короче 2 символов.");
      return;
    }
    if (photos.length > 5) {
      setError("Можно указать не более 5 фотографий.");
      return;
    }
    if (parsedIngredients.length === 0) {
      setError("Нужно добавить минимум один продукт в состав.");
      return;
    }
    if (Number(portionSizeGrams) <= 0) {
      setError("Размер порции должен быть больше 0.");
      return;
    }

    const payload = {
      name,
      photos,
      ingredients: parsedIngredients,
      portionSizeGrams: Number(portionSizeGrams),
      category: category || undefined,
      isVegan: calcInfo ? isVegan && calcInfo.isVegan : isVegan,
      isGlutenFree: calcInfo ? isGlutenFree && calcInfo.isGlutenFree : isGlutenFree,
      isSugarFree: calcInfo ? isSugarFree && calcInfo.isSugarFree : isSugarFree,
      caloriesPerPortion: Number(caloriesPerPortion),
      proteinPerPortion: Number(proteinPerPortion),
      fatPerPortion: Number(fatPerPortion),
      carbsPerPortion: Number(carbsPerPortion),
    };
    setSaving(true);
    try {
      const dish = await apiRequest<DishDto>(
        mode === "create" ? "/api/dishes" : `/api/dishes/${initial?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      onSuccess(dish);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Не удалось сохранить блюдо.");
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
        <label>Название</label>
        <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <p className="text-muted">
        На 100 г (расчетно): {per100gPreview.caloriesPer100g} / {per100gPreview.proteinPer100g} /{" "}
        {per100gPreview.fatPer100g} / {per100gPreview.carbsPer100g}
      </p>

      <div className="field">
        <label>Фотографии (вставка из буфера, файл с компьютера, либо ссылки)</label>
        <div className="row">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            disabled={uploading || saving}
          />
          <span className="text-muted">{uploading ? "Загружаем фото..." : "До 5 файлов"}</span>
        </div>
        <textarea
          rows={4}
          value={photosText}
          onChange={(e) => setPhotosText(e.target.value)}
          onPaste={onPastePhotos}
        />
        {photosText.trim() ? (
          <div className="photo-grid">
            {photosText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt={`Фото блюда ${index + 1}`} />
              ))}
          </div>
        ) : null}
      </div>

      <DishIngredientsEditor ingredients={ingredients} products={products} onChange={setIngredients} />

      <div className="grid-2">
        <div className="field">
          <label>Размер порции, г</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={portionSizeGrams}
            onChange={(e) => setPortionSizeGrams(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Категория</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Определить по макросу из названия</option>
            {dishCategoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label>Калорийность, ккал/порция</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={caloriesPerPortion}
            onChange={(e) => {
              setIsNutritionManuallyEdited(true);
              setCaloriesPerPortion(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <label>Белки, г/порция</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={proteinPerPortion}
            onChange={(e) => {
              setIsNutritionManuallyEdited(true);
              setProteinPerPortion(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <label>Жиры, г/порция</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={fatPerPortion}
            onChange={(e) => {
              setIsNutritionManuallyEdited(true);
              setFatPerPortion(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <label>Углеводы, г/порция</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={carbsPerPortion}
            onChange={(e) => {
              setIsNutritionManuallyEdited(true);
              setCarbsPerPortion(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="flags-row">
        <label>
          <input
            type="checkbox"
            checked={isVegan}
            onChange={(e) => setIsVegan(e.target.checked)}
            disabled={calcInfo ? !calcInfo.isVegan : false}
          />
          Веган
        </label>
        <label>
          <input
            type="checkbox"
            checked={isGlutenFree}
            onChange={(e) => setIsGlutenFree(e.target.checked)}
            disabled={calcInfo ? !calcInfo.isGlutenFree : false}
          />
          Без глютена
        </label>
        <label>
          <input
            type="checkbox"
            checked={isSugarFree}
            onChange={(e) => setIsSugarFree(e.target.checked)}
            disabled={calcInfo ? !calcInfo.isSugarFree : false}
          />
          Без сахара
        </label>
      </div>

      {calcInfo?.macroCategory ? (
        <p className="text-muted">Категория по макросу: {calcInfo.macroCategory}</p>
      ) : null}

      {error ? <p className="text-error">{error}</p> : null}
      {!error ? (
        <p className="text-muted">
          {isNutritionManuallyEdited
            ? "КБЖУ зафиксированы вручную и не перезаписываются автоподсчетом."
            : "Форма подставляет черновые КБЖУ автоматически, но ты можешь их изменить вручную."}
        </p>
      ) : null}

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Сохраняем..." : mode === "create" ? "Создать блюдо" : "Сохранить изменения"}
      </button>
    </form>
  );
}

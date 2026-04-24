"use client";

import type { ProductShortDto } from "@/lib/frontend/dish-options";

export type IngredientState = {
  productId: string;
  grams: string;
};

type Props = {
  ingredients: IngredientState[];
  products: ProductShortDto[];
  onChange: (next: IngredientState[]) => void;
};

export function DishIngredientsEditor({ ingredients, products, onChange }: Props) {
  function updateAt(index: number, patch: Partial<IngredientState>) {
    const next = ingredients.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function removeAt(index: number) {
    const next = ingredients.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ productId: "", grams: "" }]);
  }

  function addRow() {
    onChange([...ingredients, { productId: "", grams: "" }]);
  }

  return (
    <div className="panel">
      <div className="page-head">
        <h3>Состав блюда</h3>
        <button className="btn-secondary" type="button" onClick={addRow}>
          + Добавить продукт
        </button>
      </div>
      <div className="list">
        {ingredients.map((item, index) => (
          <div className="grid-3" key={`ing-${index}`}>
            <select
              value={item.productId}
              onChange={(e) => updateAt(index, { productId: e.target.value })}
            >
              <option value="">Выберите продукт</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Грамм в порции"
              value={item.grams}
              onChange={(e) => updateAt(index, { grams: e.target.value })}
            />
            <button className="link-danger" type="button" onClick={() => removeAt(index)}>
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

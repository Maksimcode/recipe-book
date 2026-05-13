/**
 * URL карточки сущности: сегмент после `/products/` или `/dishes/` не должен совпадать с
 * маршрутом формы **`new`**, иначе `[^/]+` ошибочно принимается за id.
 */
export const productDetailPathRe = /\/products\/(?!new$)[^/]+$/;
export const dishDetailPathRe = /\/dishes\/(?!new$)[^/]+$/;

export function productIdFromUrl(url: string): string | null {
  const m = url.match(/\/products\/(?!new$)([^/]+)$/);
  return m?.[1] ?? null;
}

export function dishIdFromUrl(url: string): string | null {
  const m = url.match(/\/dishes\/(?!new$)([^/]+)$/);
  return m?.[1] ?? null;
}

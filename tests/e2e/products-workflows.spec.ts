import { expect, test } from "@playwright/test";

import { productDetailPathRe, productIdFromUrl } from "./helpers/detail-url";
import { fillDefaultNutrition } from "./helpers/fill-product-form";

/**
 * Системные UI-тесты: список продуктов — поиск, фильтры, редактирование, удаление.
 *
 * Цепочка **serial**: один продукт с **уникальным именем** (нет дублей «Чечевица» в БД → strict mode).
 * Дальнейшие шагы привязываются к карточке по `productId` (ссылка «Редактировать»).
 * Карточка — `<article role="button">`: в дереве доступности это кнопка, не article.
 * Ищем `getByRole("button")` с ссылкой «Редактировать» на нужный id.
 */

test.describe("Продукты: список, фильтры, правка, удаление", () => {
  test.describe.configure({ mode: "serial" });

  let productId: string;
  let productName: string;
  let productRenamed: string;

  function cardByProductId(page: import("@playwright/test").Page) {
    return page.getByRole("button").filter({
      has: page.locator(`a[href="/products/${productId}/edit"]`),
    });
  }

  test("создание продукта с веган-флагом для фильтров", async ({ page }) => {
    productName = `Чечевица ${Date.now()}`;
    productRenamed = `${productName} запечённая`;

    await page.goto("/products/new");
    await page.getByLabel("Название").fill(productName);
    await fillDefaultNutrition(page);
    await page.getByLabel("Категория").selectOption({ label: "Крупы" });
    await page.getByLabel("Веган").check();
    await page.getByRole("button", { name: "Создать продукт" }).click();
    await expect(page).toHaveURL(productDetailPathRe);
    const id = productIdFromUrl(page.url());
    if (!id) throw new Error("Нет id в URL после создания (ожидался путь вида /products/<id>).");
    productId = id;
  });

  test("список: фильтр категории «Крупы» и «Веган: да»", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: "Продукты" })).toBeVisible();

    const panel = page.locator(".panel.grid-3").first();
    const listReady = page.waitForResponse((r) => {
      if (r.request().method() !== "GET" || !r.ok()) return false;
      const u = new URL(r.url());
      if (!u.pathname.endsWith("/api/products")) return false;
      return u.searchParams.get("category") === "GRAINS" && u.searchParams.get("isVegan") === "true";
    });
    await panel.locator("select").nth(0).selectOption({ value: "GRAINS" });
    await panel.locator("select").nth(4).selectOption({ value: "true" });
    await listReady;

    await expect(page.getByText("Загрузка...")).toHaveCount(0);

    const card = cardByProductId(page);
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(productName);
  });

  test("список: поиск по названию", async ({ page }) => {
    await page.goto("/products");
    await page.getByPlaceholder("Поиск по названию...").fill(productName);
    await page.getByRole("button", { name: "Искать" }).click();
    await expect(cardByProductId(page).getByRole("heading", { level: 3 })).toHaveText(productName);
  });

  test("редактирование: смена названия и сохранение", async ({ page }) => {
    await page.goto(`/products/${productId}/edit`);
    await expect(page.getByRole("heading", { name: "Редактирование продукта" })).toBeVisible();
    await page.getByLabel("Название").fill(productRenamed);
    await page.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(page).toHaveURL(new RegExp(`/products/${productId}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(productRenamed);
  });

  test("удаление из списка с подтверждением", async ({ page, request }) => {
    page.once("dialog", (d) => d.accept());
    await page.goto("/products");
    const card = cardByProductId(page);
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(productRenamed);
    await card.getByRole("button", { name: "Удалить" }).click();
    await expect(card).toHaveCount(0);
    const res = await request.get(`/api/products/${productId}`);
    expect(res.status()).toBe(404);
  });
});

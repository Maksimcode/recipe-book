import { expect, test } from "@playwright/test";

import { apiCreateProduct, apiDeleteDish, apiDeleteProduct } from "./helpers/api";
import { dishDetailPathRe, dishIdFromUrl } from "./helpers/detail-url";

/**
 * Системные UI-тесты: создание блюда (`/dishes/new`).
 *
 * Предусловие: продукт-ингредиент создаётся через **`request` (API)** в `beforeAll`, чтобы его `id`
 * гарантированно совпадал с `<option value="…">` на странице (отдельный `browser.newContext` в
 * `beforeAll` ходил в тот же сервер, но список опций в тесте не всегда успевал совпасть с id).
 * Удаление в `afterAll` — техническая очистка.
 *
 * Тест-дизайн:
 * - **ЭР** — полный состав vs пустой состав.
 * - **ГЗ / BVA** — порция: 0 (текст из формы), отрицательные (−0.01, −1) — HTML5 `min=0`; блок «На 100 г» после расчёта.
 */

test.describe("Блюдо: форма создания", () => {
  test.describe.configure({ mode: "serial" });

  let ingredientProductId: string;

  test.beforeAll(async ({ request }) => {
    const created = await apiCreateProduct(request);
    ingredientProductId = created.id;
  });

  test.afterAll(async ({ request }) => {
    await apiDeleteProduct(request, ingredientProductId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dishes/new");
    await expect(page.getByRole("heading", { name: "Новое блюдо" })).toBeVisible();
    await expect(page.getByText("Загрузка...")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Состав блюда" })).toBeVisible();
  });

  test("создаёт блюдо: карточка и строка КБЖУ на 100 г после автосчёта", async ({
    page,
    request,
  }) => {
    const dishName = "Борщ";
    let dishId: string | undefined;

    try {
      await page.getByLabel("Название", { exact: true }).fill(dishName);

      const ingredientsPanel = page
        .locator(".panel")
        .filter({ has: page.getByRole("heading", { name: "Состав блюда" }) });
      await ingredientsPanel.locator("select").first().selectOption(ingredientProductId);
      await ingredientsPanel.getByPlaceholder("Грамм в порции").fill("150");

      const calcResponse = page.waitForResponse(
        (r) =>
          r.url().includes("/api/dishes/calculate-nutrition") &&
          r.request().method() === "POST" &&
          r.ok(),
        { timeout: 15_000 },
      );
      await page.getByLabel("Размер порции, г").fill("200");
      await calcResponse;

      await expect(page.getByLabel("Калорийность, ккал/порция")).not.toHaveValue("0", {
        timeout: 5_000,
      });
      await expect(page.locator("p.text-muted").filter({ hasText: "На 100 г" })).toBeVisible();
      await expect(page.locator("p.text-muted").filter({ hasText: "На 100 г" })).toContainText(
        /\d/,
      );

      /** Без категории и без макроса в названии API вернёт 400 («Dish category is required»). */
      await page.locator("#dish-form-category").selectOption({ value: "SOUP" });
      await expect(page.locator("#dish-form-category")).toHaveValue("SOUP");

      const createDish = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          r.url().includes("/api/dishes") &&
          !r.url().includes("calculate-nutrition"),
      );
      await page.getByRole("button", { name: "Создать блюдо" }).click();
      const created = await createDish;
      if (created.status() !== 201) {
        throw new Error(`POST /api/dishes ожидался 201, получено ${created.status()}: ${await created.text()}`);
      }

      await expect(page).toHaveURL(dishDetailPathRe);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(dishName);

      dishId = dishIdFromUrl(page.url()) ?? undefined;
    } finally {
      if (dishId) await apiDeleteDish(request, dishId);
    }
  });

  /** «0» проходит HTML5 `min=0` и отсекается в `onSubmit`; отрицательные — класс HTML5 range (как калории в продукте). */
  const invalidPortions: { label: string; value: string; html5Only: boolean }[] = [
    { label: "ноль", value: "0", html5Only: false },
    { label: "чуть ниже нуля", value: "-0.01", html5Only: true },
    { label: "отрицательная целая", value: "-1", html5Only: true },
  ];

  for (const { label, value, html5Only } of invalidPortions) {
    test(`BVA порции (негативный класс): ${label} (${value})`, async ({ page }) => {
      await page.getByLabel("Название", { exact: true }).fill("Щи");

      const ingredientsPanel = page
        .locator(".panel")
        .filter({ has: page.getByRole("heading", { name: "Состав блюда" }) });
      await ingredientsPanel.locator("select").first().selectOption(ingredientProductId);
      await ingredientsPanel.getByPlaceholder("Грамм в порции").fill("100");

      const portion = page.getByLabel("Размер порции, г");
      await portion.fill(value);
      if (html5Only) {
        await expect(portion).toHaveJSProperty("validity.valid", false);
      }
      await page.getByRole("button", { name: "Создать блюдо" }).click();

      if (!html5Only) {
        await expect(page.getByText("Размер порции должен быть больше 0.")).toBeVisible();
      }
      await expect(page).toHaveURL(/\/dishes\/new$/);
    });
  }

  test("ЭР: без выбранного продукта в составе — ошибка", async ({ page }) => {
    await page.getByLabel("Название", { exact: true }).fill("Окрошка");
    await page.getByLabel("Размер порции, г").fill("100");
    await page.getByRole("button", { name: "Создать блюдо" }).click();

    await expect(page.getByText("Нужно добавить минимум один продукт в состав.")).toBeVisible();
    await expect(page).toHaveURL(/\/dishes\/new$/);
  });
});

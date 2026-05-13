import { expect, test } from "@playwright/test";

import { apiDeleteProduct } from "./helpers/api";
import { productDetailPathRe, productIdFromUrl } from "./helpers/detail-url";
import { fillDefaultNutrition } from "./helpers/fill-product-form";

/**
 * Системные UI-тесты: создание продукта (`/products/new`).
 *
 * Тест-дизайн:
 * - **ЭР** — валидные данные vs нарушение правил (лишние фото).
 * - **ГЗ / BVA** — имя: 1 символ (недопустимо), 2 символа (нижняя граница допустимого); БЖУ у границы 100/101;
 *   калорийность &lt; 0 (негативный класс для числового поля).
 */

test.describe("Продукт: форма создания", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/new");
    await expect(page.getByRole("heading", { name: "Новый продукт" })).toBeVisible();
  });

  test("создаёт продукт и открывает карточку", async ({ page, request }) => {
    const name = "Гречка";
    let productId: string | undefined;

    try {
      await page.getByLabel("Название").fill(name);
      await fillDefaultNutrition(page);
      await page.getByRole("button", { name: "Создать продукт" }).click();

      await expect(page).toHaveURL(productDetailPathRe);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);

      productId = productIdFromUrl(page.url()) ?? undefined;
    } finally {
      if (productId) await apiDeleteProduct(request, productId);
    }
  });

  test("ГЗ имени: ровно 2 символа — нижняя допустимая граница", async ({ page, request }) => {
    const name = "Пю";
    let productId: string | undefined;
    try {
      await page.getByLabel("Название").fill(name);
      await fillDefaultNutrition(page);
      await page.getByRole("button", { name: "Создать продукт" }).click();
      await expect(page).toHaveURL(productDetailPathRe);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
      productId = productIdFromUrl(page.url()) ?? undefined;
    } finally {
      if (productId) await apiDeleteProduct(request, productId);
    }
  });

  test("ГЗ БЖУ: 100 допустимо, 101 блокирует кнопку; ЭР: не больше пяти фото", async ({
    page,
  }) => {
    await page.getByLabel("Название").fill("Овсянка");
    await page.getByLabel("Калорийность, ккал/100г").fill("50");

    await page.getByLabel("Белки, г/100г").fill("34");
    await page.getByLabel("Жиры, г/100г").fill("33");
    await page.getByLabel("Углеводы, г/100г").fill("34");
    const submit = page.getByRole("button", { name: "Создать продукт" });
    await expect(submit).toBeDisabled();
    await expect(page.locator("p").filter({ hasText: "Сумма БЖУ:" })).toHaveClass(/text-error/);

    await page.getByLabel("Углеводы, г/100г").fill("33");
    await expect(submit).not.toBeDisabled();
    await expect(page.locator("p").filter({ hasText: "Сумма БЖУ:" })).not.toHaveClass(/text-error/);

    await fillDefaultNutrition(page);
    const lines = Array.from({ length: 6 }, (_, i) => `https://example.com/shot-${i + 1}.jpg`);
    await page.getByLabel(/Фотографии \(вставка из буфера/).fill(lines.join("\n"));
    await page.getByRole("button", { name: "Создать продукт" }).click();
    await expect(page.getByText("Можно указать не более 5 фотографий.")).toBeVisible();
    await expect(page).toHaveURL(/\/products\/new$/);
  });

  test("ГЗ имени: один символ не проходит проверку браузера", async ({ page }) => {
    const input = page.getByLabel("Название");
    await input.fill("Я");
    await fillDefaultNutrition(page);
    await expect(input).toHaveJSProperty("validity.valid", false);
    await page.getByRole("button", { name: "Создать продукт" }).click();
    await expect(page).toHaveURL(/\/products\/new$/);
  });

  test("BVA калорий: отрицательное значение — класс недопустимых чисел (HTML5 min=0)", async ({
    page,
  }) => {
    await page.getByLabel("Название").fill("Рис");
    const calories = page.getByLabel("Калорийность, ккал/100г");
    await calories.fill("-1");
    await page.getByLabel("Белки, г/100г").fill("10");
    await page.getByLabel("Жиры, г/100г").fill("5");
    await page.getByLabel("Углеводы, г/100г").fill("20");
    await expect(calories).toHaveJSProperty("validity.valid", false);
    await page.getByRole("button", { name: "Создать продукт" }).click();
    await expect(page).toHaveURL(/\/products\/new$/);
  });
});

import { expect, test } from "@playwright/test";

/**
 * Дымовой тест: главная и переходы в разделы каталога.
 */

test("главная → продукты и блюда", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Продукты/i }).first().click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { name: /Продукты/i })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: /Блюда/i }).first().click();
  await expect(page).toHaveURL(/\/dishes$/);
  await expect(page.getByRole("heading", { name: /Блюда/i })).toBeVisible();
});

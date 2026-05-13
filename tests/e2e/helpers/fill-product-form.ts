import type { Page } from "@playwright/test";

export async function fillDefaultNutrition(page: Page) {
  await page.getByLabel("Калорийность, ккал/100г").fill("100");
  await page.getByLabel("Белки, г/100г").fill("10");
  await page.getByLabel("Жиры, г/100г").fill("5");
  await page.getByLabel("Углеводы, г/100г").fill("20");
}

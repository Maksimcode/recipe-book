## Системные UI-тесты (Playwright)

В ветке добавлены **end-to-end** тесты через **Playwright** против поднимаемого **`next dev`** (см. `playwright.config.ts`: перед прогоном выполняется `prisma db push`, затем сервер на `http://127.0.0.1:3000`).

### Предусловия

- **PostgreSQL** и переменная **`DATABASE_URL`** (по умолчанию в конфиге Playwright: `postgresql://recipe:recipe@127.0.0.1:5434/recipe_book?schema=public`, порт **5434** как в `docker-compose.yml`). Обычно достаточно: `docker compose up db -d` и дождаться готовности БД.
- Один раз установить браузеры Playwright: `npx playwright install`.

Опционально: **`PLAYWRIGHT_BASE_URL`** — если задан и включён `reuseExistingServer`, можно не поднимать приложение через `webServer` (см. комментарий в `playwright.config.ts`).

### Что в `tests/e2e`

| Файл | Содержание |
|------|------------|
| `navigation.spec.ts` | Дымовой сценарий: главная → продукты и блюда |
| `products-create.spec.ts` | Создание продукта, ГЗ имени, БЖУ, BVA калорий (HTML5 `min`), лимит фото |
| `products-workflows.spec.ts` | Список: фильтры (крупы + веган), поиск, правка, удаление (serial) |
| `dishes-create.spec.ts` | Создание блюда (КБЖУ, категория), BVA порции (0 vs отрицательные и HTML5), ЭР пустого состава |
| `helpers/` | API для фикстур, URL/id деталок, заполнение форм |

Тест-дизайн в сценариях: **ЭР**, **ГЗ**, **BVA**; где уместно — разделение **сообщения формы** и **нативной валидации HTML5** (например, порция `0` vs отрицательные при `min=0`).

### Запуск

```bash
npm run test:e2e          # headless, все тесты
npm run test:e2e:ui       # интерактивный UI Playwright
npm run test:e2e:headed   # видимый браузер
npm run test:e2e:debug    # пошаговая отладка
```

Отчёт после прогона: `npx playwright show-report`.

### Связь с Vitest

**`npm run test`** (корневой `vitest.config.ts`) запускает только **`tests/unit/**`**. Интеграционные API-тесты — **`npm run test:integration`** (`vitest.integration.config.ts`). E2e **не** входят в `npm run test`, чтобы Playwright-спеки не смешивались с Vitest.

# API Integration Tests (Lab 3)

В этой ветке добавлены **интеграционные (API) тесты** для системы «Книга рецептов».  
Тесты запускаются **против реального инстанса** приложения (локального или удалённого) и проверяют backend через HTTP без изоляции.

## Что покрыто

### CRUD для продуктов (`/api/products`)
- `POST /api/products` — `tests/integration/products/create.spec.ts`
- `GET /api/products` — `tests/integration/products/list.spec.ts`
- `GET /api/products/:id` — `tests/integration/products/get.spec.ts`
- `PATCH /api/products/:id` — `tests/integration/products/update.spec.ts`
- `DELETE /api/products/:id` — `tests/integration/products/delete.spec.ts`  
  Включая бизнес-ограничение: **нельзя удалить продукт, используемый в блюде** (`409 PRODUCT_IN_USE`).

### CRUD для блюд (`/api/dishes`)
- `POST /api/dishes` — `tests/integration/dishes/create.spec.ts`
- `GET /api/dishes` — `tests/integration/dishes/list.spec.ts`
- `GET /api/dishes/:id` — `tests/integration/dishes/get.spec.ts`
- `PATCH /api/dishes/:id` — `tests/integration/dishes/update.spec.ts`
- `DELETE /api/dishes/:id` — `tests/integration/dishes/delete.spec.ts`

### Автоматический расчёт КБЖУ (preview)
- `POST /api/dishes/calculate-nutrition` — `tests/integration/dishes/calculate-nutrition.spec.ts`  
Проверяются: корректность расчёта, валидации, доступность флагов и макросы категории.

## Что использовано по ТЗ

- Библиотека тестирования: **Vitest**
- Формат: **интеграционные/API тесты через HTTP без изоляции**
- Техники тест-дизайна:
  - **эквивалентное разбиение (ЭР)**
  - **анализ граничных значений (BVA)**

## Дополнительно

- Использована параметризация (`it.each`)
- Использованы setup/teardown:
  - `beforeAll/afterAll` для подготовки и очистки данных
  - `beforeEach/afterEach` там, где нужен «чистый объект на тест»
- Вынесены helper-модули:
  - HTTP-клиент: `tests/integration/helpers/api.ts`
  - фикстуры: `tests/integration/helpers/fixtures.ts`
- Отдельный конфиг интеграционных тестов: `vitest.integration.config.ts`
- Запуск на удалённом инстансе через `INTEGRATION_BASE_URL`

## Запуск

1. Запустить сервер (в отдельной вкладке):
```bash
npm run dev

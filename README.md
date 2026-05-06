В этой ветке добавлены интеграционные (API) тесты для системы «Книга рецептов». Тесты запускаются против реального инстанса приложения (локального или удалённого) и проверяют backend через HTTP без изоляции.

Что покрыто
CRUD для продуктов (/api/products)

POST /api/products — tests/integration/products/create.spec.ts
GET /api/products — tests/integration/products/list.spec.ts
GET /api/products/:id — tests/integration/products/get.spec.ts
PATCH /api/products/:id — tests/integration/products/update.spec.ts
DELETE /api/products/:id — tests/integration/products/delete.spec.ts
включая бизнес‑ограничение: нельзя удалить продукт, используемый в блюде (ожидается 409 PRODUCT_IN_USE)
CRUD для блюд (/api/dishes)

POST /api/dishes — tests/integration/dishes/create.spec.ts
GET /api/dishes — tests/integration/dishes/list.spec.ts
GET /api/dishes/:id — tests/integration/dishes/get.spec.ts
PATCH /api/dishes/:id — tests/integration/dishes/update.spec.ts
DELETE /api/dishes/:id — tests/integration/dishes/delete.spec.ts
Автоматический расчёт КБЖУ (preview)
POST /api/dishes/calculate-nutrition — tests/integration/dishes/calculate-nutrition.spec.ts
Проверяется корректность расчёта, валидации, доступность флагов и макросы категории.

Что использовано по ТЗ
Библиотека тестирования: vitest
Тестирование через API без изоляции: реальные HTTP‑запросы к работающему серверу
Техники тест‑дизайна:
эквивалентное разбиение (ЭР)
анализ граничных значений (BVA)
Дополнительно
Параметризация: it.each(...)
Setup/Teardown:
beforeAll/afterAll для подготовки и очистки данных
beforeEach/afterEach там, где нужен «чистый объект на тест»
Запуск на удалённом инстансе: через переменную окружения INTEGRATION_BASE_URL (без изменения кода тестов)
Вспомогательные модули:
HTTP‑клиент: tests/integration/helpers/api.ts
фикстуры: tests/integration/helpers/fixtures.ts
конфиг интеграционных тестов: vitest.integration.config.ts
Запуск
Запусти сервер (в отдельной вкладке):
npm run dev
Запусти интеграционные тесты (в другой вкладке):
INTEGRATION_BASE_URL=http://localhost:3000 npm run test:integration
Запуск против удалённого инстанса:

INTEGRATION_BASE_URL=https://<your-remote-host> npm run test:integration

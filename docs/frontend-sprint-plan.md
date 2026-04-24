# Frontend Sprint Plan

## Sprint 1 - Foundation + Products CRUD

- [x] `docs/frontend-sprint-plan.md` - зафиксировать план и статусы.
- [x] `src/app/layout.tsx` - общий layout c top navigation.
- [x] `src/app/page.tsx` - стартовый dashboard с ссылками на разделы.
- [x] `src/lib/frontend/api.ts` - единый fetch-клиент и обработка backend ошибок.
- [x] `src/lib/frontend/product-options.ts` - enum-опции и лейблы для продукта.
- [x] `src/components/forms/ProductForm.tsx` - единая форма create/edit.
- [x] `src/app/products/page.tsx` - список продуктов (фильтры, поиск, сортировка, удаление).
- [x] `src/app/products/new/page.tsx` - создание продукта.
- [x] `src/app/products/[id]/page.tsx` - просмотр продукта.
- [x] `src/app/products/[id]/edit/page.tsx` - редактирование продукта.
- [x] `src/app/globals.css` - базовые utility-классы интерфейса.

## Sprint 2 - Dishes CRUD + Nutrition UX

- [x] `src/lib/frontend/dish-options.ts` - enum-опции и лейблы для блюда.
- [x] `src/components/forms/DishIngredientsEditor.tsx` - редактор состава блюда.
- [x] `src/components/forms/DishForm.tsx` - единая форма create/edit блюда.
- [x] `src/app/dishes/page.tsx` - список блюд (фильтры и поиск).
- [x] `src/app/dishes/new/page.tsx` - создание блюда с черновым расчетом.
- [x] `src/app/dishes/[id]/page.tsx` - просмотр блюда с полным составом.
- [x] `src/app/dishes/[id]/edit/page.tsx` - редактирование блюда.

## Sprint 3 - UX Polish + QA readiness

- [x] `README.md` - frontend runbook и проверка пользовательских сценариев.
- [x] `src/components/**` - улучшения UX (loading/error states, empty states).
- [x] `src/app/**` - финальная проходка валидаций, текстов ошибок и edge-cases.

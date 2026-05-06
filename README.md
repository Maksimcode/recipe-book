В этой ветке добавлены unit-тесты для автоматического расчета калорийности блюда.

Что покрыто:

функция calculateAutoNutrition в src/lib/dishes/domain.ts;
тесты находятся в tests/unit/dishes/calculate-auto-nutrition.spec.ts.
Что использовано по ТЗ:

библиотека unit-тестирования: vitest;
техники тест-дизайна:
эквивалентное разбиение;
анализ граничных значений.
Дополнительно:

применена параметризация тестов (it.each);
добавлены docstring-комментарии к тест-сьютам и кейсам.
Запуск:

npm test
npm run test:coverage

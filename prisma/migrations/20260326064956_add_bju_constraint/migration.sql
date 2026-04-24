-- Enforce business rule: protein + fat + carbs must be <= 100 for each product.
CREATE TRIGGER "product_bju_sum_check_insert"
BEFORE INSERT ON "Product"
FOR EACH ROW
WHEN (
  CAST(NEW."proteinPer100g" AS REAL) +
  CAST(NEW."fatPer100g" AS REAL) +
  CAST(NEW."carbsPer100g" AS REAL)
) > 100
BEGIN
  SELECT RAISE(ABORT, 'BJU sum must be less than or equal to 100');
END;

CREATE TRIGGER "product_bju_sum_check_update"
BEFORE UPDATE OF "proteinPer100g", "fatPer100g", "carbsPer100g" ON "Product"
FOR EACH ROW
WHEN (
  CAST(NEW."proteinPer100g" AS REAL) +
  CAST(NEW."fatPer100g" AS REAL) +
  CAST(NEW."carbsPer100g" AS REAL)
) > 100
BEGIN
  SELECT RAISE(ABORT, 'BJU sum must be less than or equal to 100');
END;
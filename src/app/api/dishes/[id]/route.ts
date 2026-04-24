import { NextResponse } from "next/server";

import {
  calculateAutoNutrition,
  calculateBjuPer100gSum,
  calculateFlagsAvailability,
  dishCategories,
  type DishCategoryValue,
  findMissingProductIds,
  parseIngredientsInput,
  parseMacroCategory,
  toNonNegativeNumber,
} from "@/lib/dishes/domain";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type IngredientInput = {
  productId: string;
  grams: number;
};

type UpdateDishPayload = {
  name?: unknown;
  photos?: unknown;
  ingredients?: unknown;
  portionSizeGrams?: unknown;
  category?: unknown;
  isVegan?: unknown;
  isGlutenFree?: unknown;
  isSugarFree?: unknown;
  caloriesPerPortion?: unknown;
  proteinPerPortion?: unknown;
  fatPerPortion?: unknown;
  carbsPerPortion?: unknown;
};


function parseUpdatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const data = payload as UpdateDishPayload;

  let name: string | undefined;
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) {
      throw new Error('Field "name" must be at least 2 characters.');
    }
    name = data.name.trim();
  }

  let photos: string[] | undefined;
  if (data.photos !== undefined) {
    if (
      !Array.isArray(data.photos) ||
      data.photos.some((item) => typeof item !== "string" || item.trim().length === 0)
    ) {
      throw new Error('Field "photos" must be an array of non-empty strings.');
    }
    if (data.photos.length > 5) {
      throw new Error('Field "photos" must contain at most 5 items.');
    }
    photos = data.photos.map((item) => item.trim());
  }

  let ingredients: IngredientInput[] | undefined;
  if (data.ingredients !== undefined) {
    ingredients = parseIngredientsInput(data.ingredients);
  }

  let portionSizeGrams: number | undefined;
  if (data.portionSizeGrams !== undefined) {
    portionSizeGrams = toNonNegativeNumber(data.portionSizeGrams, "portionSizeGrams");
    if (portionSizeGrams <= 0) {
      throw new Error('Field "portionSizeGrams" must be greater than 0.');
    }
  }

  let category: DishCategoryValue | undefined;
  if (data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      !dishCategories.includes(data.category as DishCategoryValue)
    ) {
      throw new Error(
        `Field "category" must be one of: ${dishCategories.join(", ")}.`,
      );
    }
    category = data.category as DishCategoryValue;
  }

  for (const field of ["isVegan", "isGlutenFree", "isSugarFree"] as const) {
    if (data[field] !== undefined && typeof data[field] !== "boolean") {
      throw new Error(`Field "${field}" must be a boolean.`);
    }
  }

  const nutritionOverrides: {
    caloriesPerPortion?: number;
    proteinPerPortion?: number;
    fatPerPortion?: number;
    carbsPerPortion?: number;
  } = {};

  for (const field of [
    "caloriesPerPortion",
    "proteinPerPortion",
    "fatPerPortion",
    "carbsPerPortion",
  ] as const) {
    if (data[field] !== undefined) {
      nutritionOverrides[field] = toNonNegativeNumber(data[field], field);
    }
  }

  return {
    name,
    photos,
    ingredients,
    portionSizeGrams,
    category,
    isVegan: data.isVegan,
    isGlutenFree: data.isGlutenFree,
    isSugarFree: data.isSugarFree,
    nutritionOverrides,
  };
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: 'Path param "id" is required.' } },
        { status: 400 },
      );
    }

    const dish = await prisma.dish.findUnique({
      where: { id: id.trim() },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        ingredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                caloriesPer100g: true,
                proteinPer100g: true,
                fatPer100g: true,
                carbsPer100g: true,
                isVegan: true,
                isGlutenFree: true,
                isSugarFree: true,
              },
            },
          },
        },
      },
    });

    if (!dish) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Dish not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: dish }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: 'Path param "id" is required.' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const payload = parseUpdatePayload(body);
    const dishId = id.trim();

    const existingDish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: {
        ingredients: {
          select: {
            productId: true,
            grams: true,
          },
        },
      },
    });

    if (!existingDish) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Dish not found." } },
        { status: 404 },
      );
    }

    const nextIngredients: IngredientInput[] =
      payload.ingredients ??
      existingDish.ingredients.map((item) => ({
        productId: item.productId,
        grams: Number(item.grams),
      }));

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: nextIngredients.map((item) => item.productId),
        },
      },
      select: {
        id: true,
        caloriesPer100g: true,
        proteinPer100g: true,
        fatPer100g: true,
        carbsPer100g: true,
        isVegan: true,
        isGlutenFree: true,
        isSugarFree: true,
      },
    });

    if (products.length !== nextIngredients.length) {
      const missingIds = findMissingProductIds(nextIngredients, products);

      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Some ingredients reference missing products: ${missingIds.join(", ")}.`,
          },
        },
        { status: 400 },
      );
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const autoNutrition = calculateAutoNutrition(nextIngredients, productMap);

    const hasManualNutrition = Object.keys(payload.nutritionOverrides).length > 0;
    const baseNutrition = autoNutrition;

    const finalNutrition = {
      caloriesPerPortion:
        payload.nutritionOverrides.caloriesPerPortion ?? baseNutrition.caloriesPerPortion,
      proteinPerPortion:
        payload.nutritionOverrides.proteinPerPortion ?? baseNutrition.proteinPerPortion,
      fatPerPortion: payload.nutritionOverrides.fatPerPortion ?? baseNutrition.fatPerPortion,
      carbsPerPortion:
        payload.nutritionOverrides.carbsPerPortion ?? baseNutrition.carbsPerPortion,
    };

    const finalPortionSize = payload.portionSizeGrams ?? Number(existingDish.portionSizeGrams);
    const bjuPer100gSum = calculateBjuPer100gSum(finalNutrition, finalPortionSize);

    if (bjuPer100gSum > 100) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Invalid nutrition values: (protein + fat + carbs) per 100g must be <= 100.",
          },
        },
        { status: 400 },
      );
    }

    const flagsAvailability = calculateFlagsAvailability(products);

    if (payload.isVegan === true && !flagsAvailability.isVegan) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              'Dish flag "isVegan" can be true only when all ingredient products are vegan.',
          },
        },
        { status: 400 },
      );
    }
    if (payload.isGlutenFree === true && !flagsAvailability.isGlutenFree) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              'Dish flag "isGlutenFree" can be true only when all ingredient products are gluten-free.',
          },
        },
        { status: 400 },
      );
    }
    if (payload.isSugarFree === true && !flagsAvailability.isSugarFree) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              'Dish flag "isSugarFree" can be true only when all ingredient products are sugar-free.',
          },
        },
        { status: 400 },
      );
    }

    const currentName = payload.name ?? existingDish.name;
    const macroResult = parseMacroCategory(currentName);
    const finalName = macroResult.cleanedName.length > 0 ? macroResult.cleanedName : currentName;
    const finalNameNormalized = finalName.toLocaleLowerCase("ru-RU");
    const finalCategory =
      payload.category ?? macroResult.macroCategory ?? (existingDish.category as DishCategoryValue);

    const updatedDish = await prisma.dish.update({
      where: { id: dishId },
      data: {
        name: finalName,
        nameNormalized: finalNameNormalized,
        category: finalCategory,
        portionSizeGrams: finalPortionSize,
        caloriesPerPortion: finalNutrition.caloriesPerPortion,
        proteinPerPortion: finalNutrition.proteinPerPortion,
        fatPerPortion: finalNutrition.fatPerPortion,
        carbsPerPortion: finalNutrition.carbsPerPortion,
        isNutritionManuallyEdited: hasManualNutrition
          ? true
          : false,
        isVegan: (payload.isVegan ?? existingDish.isVegan) && flagsAvailability.isVegan,
        isGlutenFree:
          (payload.isGlutenFree ?? existingDish.isGlutenFree) && flagsAvailability.isGlutenFree,
        isSugarFree:
          (payload.isSugarFree ?? existingDish.isSugarFree) && flagsAvailability.isSugarFree,
        ...(payload.photos
          ? {
              photos: {
                deleteMany: {},
                create: payload.photos.map((photoUrl, index) => ({
                  photoUrl,
                  sortOrder: index,
                })),
              },
            }
          : {}),
        ...(payload.ingredients
          ? {
              ingredients: {
                deleteMany: {},
                create: payload.ingredients.map((ingredient) => ({
                  productId: ingredient.productId,
                  grams: ingredient.grams,
                })),
              },
            }
          : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        ingredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: updatedDish,
        meta: {
          autoNutrition,
          categoryDetectedFromMacro: macroResult.macroCategory ?? null,
          flagsAvailability: {
            isVegan: flagsAvailability.isVegan,
            isGlutenFree: flagsAvailability.isGlutenFree,
            isSugarFree: flagsAvailability.isSugarFree,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: 'Path param "id" is required.' } },
        { status: 400 },
      );
    }

    const dishId = id.trim();
    const existingDish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: { id: true },
    });

    if (!existingDish) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Dish not found." } },
        { status: 404 },
      );
    }

    await prisma.dish.delete({
      where: { id: dishId },
    });

    return NextResponse.json({ data: { deleted: true, id: dishId } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
      { status: 500 },
    );
  }
}

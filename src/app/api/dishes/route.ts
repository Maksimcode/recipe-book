import { NextResponse } from "next/server";

import {
  calculateAutoNutrition,
  calculateBjuPer100gSum,
  calculateFlagsAvailability,
  dishCategories,
  type DishCategoryValue,
  findMissingProductIds,
  parseBooleanFilter,
  parseIngredientsInput,
  parseMacroCategory,
  toNonNegativeNumber,
} from "@/lib/dishes/domain";
import { prisma } from "@/lib/prisma";

type CreateDishPayload = {
  name: unknown;
  photos: unknown;
  ingredients: unknown;
  portionSizeGrams: unknown;
  category?: unknown;
  isVegan?: unknown;
  isGlutenFree?: unknown;
  isSugarFree?: unknown;
  caloriesPerPortion?: unknown;
  proteinPerPortion?: unknown;
  fatPerPortion?: unknown;
  carbsPerPortion?: unknown;
};

function parseCreatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const data = payload as CreateDishPayload;

  if (typeof data.name !== "string" || data.name.trim().length < 2) {
    throw new Error('Field "name" is required and must be at least 2 characters.');
  }

  const photosRaw = data.photos ?? [];
  if (!Array.isArray(photosRaw)) {
    throw new Error('Field "photos" must be an array of non-empty strings.');
  }
  if (photosRaw.length > 5) {
    throw new Error('Field "photos" must contain at most 5 items.');
  }
  if (photosRaw.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error('Field "photos" must be an array of non-empty strings.');
  }

  const ingredients = parseIngredientsInput(data.ingredients);

  const portionSizeGrams = toNonNegativeNumber(data.portionSizeGrams, "portionSizeGrams");
  if (portionSizeGrams <= 0) {
    throw new Error('Field "portionSizeGrams" must be greater than 0.');
  }

  if (data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      !dishCategories.includes(data.category as DishCategoryValue)
    ) {
      throw new Error(
        `Field "category" must be one of: ${dishCategories.join(", ")}.`,
      );
    }
  }

  for (const field of ["isVegan", "isGlutenFree", "isSugarFree"] as const) {
    if (data[field] !== undefined && typeof data[field] !== "boolean") {
      throw new Error(`Field "${field}" must be a boolean.`);
    }
  }

  const isVegan = data.isVegan === true;
  const isGlutenFree = data.isGlutenFree === true;
  const isSugarFree = data.isSugarFree === true;

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
    name: data.name.trim(),
    photos: photosRaw.map((item) => (item as string).trim()),
    ingredients,
    portionSizeGrams,
    category: data.category as DishCategoryValue | undefined,
    isVegan,
    isGlutenFree,
    isSugarFree,
    nutritionOverrides,
  };
}

function parseListParams(url: URL) {
  const categoryRaw = url.searchParams.get("category");
  const isVegan = parseBooleanFilter(url.searchParams.get("isVegan"), "isVegan");
  const isGlutenFree = parseBooleanFilter(
    url.searchParams.get("isGlutenFree"),
    "isGlutenFree",
  );
  const isSugarFree = parseBooleanFilter(
    url.searchParams.get("isSugarFree"),
    "isSugarFree",
  );

  if (
    categoryRaw !== null &&
    categoryRaw.length > 0 &&
    !dishCategories.includes(categoryRaw as DishCategoryValue)
  ) {
    throw new Error(
      `Query param "category" must be one of: ${dishCategories.join(", ")}.`,
    );
  }

  const searchRaw = url.searchParams.get("search");
  const search =
    searchRaw && searchRaw.trim().length > 0
      ? searchRaw.trim().toLocaleLowerCase("ru-RU")
      : undefined;

  return {
    where: {
      ...(categoryRaw ? { category: categoryRaw as DishCategoryValue } : {}),
      ...(typeof isVegan === "boolean" ? { isVegan } : {}),
      ...(typeof isGlutenFree === "boolean" ? { isGlutenFree } : {}),
      ...(typeof isSugarFree === "boolean" ? { isSugarFree } : {}),
      ...(search ? { nameNormalized: { contains: search } } : {}),
    },
  };
}

export async function GET(request: Request) {
  try {
    const { where } = parseListParams(new URL(request.url));

    const dishes = await prisma.dish.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: dishes }, { status: 200 });
  } catch (error) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCreatePayload(body);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: payload.ingredients.map((item) => item.productId),
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

    if (products.length !== payload.ingredients.length) {
      const missingIds = findMissingProductIds(payload.ingredients, products);
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
    const autoNutrition = calculateAutoNutrition(payload.ingredients, productMap);

    const finalNutrition = {
      caloriesPerPortion:
        payload.nutritionOverrides.caloriesPerPortion ?? autoNutrition.caloriesPerPortion,
      proteinPerPortion:
        payload.nutritionOverrides.proteinPerPortion ?? autoNutrition.proteinPerPortion,
      fatPerPortion: payload.nutritionOverrides.fatPerPortion ?? autoNutrition.fatPerPortion,
      carbsPerPortion:
        payload.nutritionOverrides.carbsPerPortion ?? autoNutrition.carbsPerPortion,
    };

    const bjuPer100gSum = calculateBjuPer100gSum(finalNutrition, payload.portionSizeGrams);
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

    if (payload.isVegan && !flagsAvailability.isVegan) {
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

    if (payload.isGlutenFree && !flagsAvailability.isGlutenFree) {
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

    if (payload.isSugarFree && !flagsAvailability.isSugarFree) {
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

    const macroResult = parseMacroCategory(payload.name);
    const finalCategory = payload.category ?? macroResult.macroCategory;
    if (!finalCategory) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              'Dish category is required (set "category" field or provide a supported macro in "name").',
          },
        },
        { status: 400 },
      );
    }
    const finalName = macroResult.cleanedName.length > 0 ? macroResult.cleanedName : payload.name;
    const finalNameNormalized = finalName.toLocaleLowerCase("ru-RU");

    const dish = await prisma.dish.create({
      data: {
        name: finalName,
        nameNormalized: finalNameNormalized,
        category: finalCategory,
        portionSizeGrams: payload.portionSizeGrams,
        caloriesPerPortion: finalNutrition.caloriesPerPortion,
        proteinPerPortion: finalNutrition.proteinPerPortion,
        fatPerPortion: finalNutrition.fatPerPortion,
        carbsPerPortion: finalNutrition.carbsPerPortion,
        isNutritionManuallyEdited: Object.keys(payload.nutritionOverrides).length > 0,
        isVegan: payload.isVegan,
        isGlutenFree: payload.isGlutenFree,
        isSugarFree: payload.isSugarFree,
        photos: {
          create: payload.photos.map((photoUrl, index) => ({
            photoUrl,
            sortOrder: index,
          })),
        },
        ingredients: {
          create: payload.ingredients.map((ingredient) => ({
            productId: ingredient.productId,
            grams: ingredient.grams,
          })),
        },
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
        data: dish,
        meta: {
          autoNutrition,
          categoryDetectedFromMacro: macroResult.macroCategory ?? null,
        },
      },
      { status: 201 },
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

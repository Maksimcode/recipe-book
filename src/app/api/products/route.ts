import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type CreateProductPayload = {
  name: unknown;
  photos?: unknown;
  caloriesPer100g: unknown;
  proteinPer100g: unknown;
  fatPer100g: unknown;
  carbsPer100g: unknown;
  ingredientsComposition?: unknown;
  category: unknown;
  cookingState: unknown;
  isVegan?: unknown;
  isGlutenFree?: unknown;
  isSugarFree?: unknown;
};

const productCategories = [
  "FROZEN",
  "MEAT",
  "VEGETABLES",
  "GREENS",
  "SPICES",
  "GRAINS",
  "CANNED",
  "LIQUID",
  "SWEETS",
] as const;
const cookingStates = ["READY_TO_EAT", "SEMI_FINISHED", "REQUIRES_COOKING"] as const;
const sortFields = ["name", "calories", "protein", "fat", "carbs"] as const;
const sortOrders = ["asc", "desc"] as const;

type SortField = (typeof sortFields)[number];
type SortOrder = (typeof sortOrders)[number];

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Field "${fieldName}" must be a non-negative number.`);
  }
  return value;
}

function parseCreatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const data = payload as CreateProductPayload;

  if (typeof data.name !== "string" || data.name.trim().length < 2) {
    throw new Error('Field "name" is required and must be at least 2 characters.');
  }

  const photos = data.photos ?? [];
  if (!Array.isArray(photos)) {
    throw new Error('Field "photos" must be an array of strings.');
  }
  if (photos.length > 5) {
    throw new Error('Field "photos" must contain at most 5 items.');
  }
  if (photos.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error('Field "photos" must contain only non-empty strings.');
  }

  if (
    typeof data.cookingState !== "string" ||
    !cookingStates.includes(data.cookingState as (typeof cookingStates)[number])
  ) {
    throw new Error(`Field "cookingState" must be one of: ${cookingStates.join(", ")}.`);
  }

  if (data.isVegan !== undefined && typeof data.isVegan !== "boolean") {
    throw new Error('Field "isVegan" must be a boolean.');
  }
  if (data.isGlutenFree !== undefined && typeof data.isGlutenFree !== "boolean") {
    throw new Error('Field "isGlutenFree" must be a boolean.');
  }
  if (data.isSugarFree !== undefined && typeof data.isSugarFree !== "boolean") {
    throw new Error('Field "isSugarFree" must be a boolean.');
  }

  if (
    typeof data.category !== "string" ||
    !productCategories.includes(data.category as (typeof productCategories)[number])
  ) {
    throw new Error(
      `Field "category" must be one of: ${productCategories.join(", ")}.`,
    );
  }

  const caloriesPer100g = toNumber(data.caloriesPer100g, "caloriesPer100g");
  const proteinPer100g = toNumber(data.proteinPer100g, "proteinPer100g");
  const fatPer100g = toNumber(data.fatPer100g, "fatPer100g");
  const carbsPer100g = toNumber(data.carbsPer100g, "carbsPer100g");
  if (proteinPer100g > 100 || fatPer100g > 100 || carbsPer100g > 100) {
    throw new Error("Fields proteinPer100g, fatPer100g and carbsPer100g must be <= 100.");
  }

  const bjuSum = proteinPer100g + fatPer100g + carbsPer100g;
  if (bjuSum > 100) {
    throw new Error('Invalid BJU values: protein + fat + carbs must be <= 100.');
  }

  const normalizedName = data.name.trim().toLocaleLowerCase("ru-RU");

  return {
    name: data.name.trim(),
    nameNormalized: normalizedName,
    photos: photos.map((url) => (url as string).trim()),
    caloriesPer100g,
    proteinPer100g,
    fatPer100g,
    carbsPer100g,
    ingredientsComposition:
      typeof data.ingredientsComposition === "string" &&
      data.ingredientsComposition.trim().length > 0
        ? data.ingredientsComposition.trim()
        : null,
    category: data.category as (typeof productCategories)[number],
    cookingState: data.cookingState as (typeof cookingStates)[number],
    isVegan: data.isVegan === true,
    isGlutenFree: data.isGlutenFree === true,
    isSugarFree: data.isSugarFree === true,
  };
}

function parseBooleanFilter(
  value: string | null,
  fieldName: string,
): boolean | undefined {
  if (value === null || value.length === 0) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Query param "${fieldName}" must be "true" or "false".`);
}

function parseListParams(url: URL) {
  const categoryRaw = url.searchParams.get("category");
  const cookingStateRaw = url.searchParams.get("cookingState");
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
    !productCategories.includes(categoryRaw as (typeof productCategories)[number])
  ) {
    throw new Error(
      `Query param "category" must be one of: ${productCategories.join(", ")}.`,
    );
  }
  if (
    cookingStateRaw !== null &&
    cookingStateRaw.length > 0 &&
    !cookingStates.includes(cookingStateRaw as (typeof cookingStates)[number])
  ) {
    throw new Error(
      `Query param "cookingState" must be one of: ${cookingStates.join(", ")}.`,
    );
  }

  const searchRaw = url.searchParams.get("search");
  const search =
    searchRaw && searchRaw.trim().length > 0
      ? searchRaw.trim().toLocaleLowerCase("ru-RU")
      : undefined;

  const sortByRaw = url.searchParams.get("sortBy") ?? "name";
  const sortOrderRaw = url.searchParams.get("sortOrder") ?? "asc";

  if (!sortFields.includes(sortByRaw as SortField)) {
    throw new Error(`Query param "sortBy" must be one of: ${sortFields.join(", ")}.`);
  }

  if (!sortOrders.includes(sortOrderRaw as SortOrder)) {
    throw new Error(`Query param "sortOrder" must be one of: ${sortOrders.join(", ")}.`);
  }

  const where = {
    ...(categoryRaw ? { category: categoryRaw as (typeof productCategories)[number] } : {}),
    ...(cookingStateRaw
      ? { cookingState: cookingStateRaw as (typeof cookingStates)[number] }
      : {}),
    ...(typeof isVegan === "boolean" ? { isVegan } : {}),
    ...(typeof isGlutenFree === "boolean" ? { isGlutenFree } : {}),
    ...(typeof isSugarFree === "boolean" ? { isSugarFree } : {}),
    ...(search
      ? {
          nameNormalized: { contains: search },
        }
      : {}),
  };

  const orderByFieldMap: Record<SortField, string> = {
    name: "name",
    calories: "caloriesPer100g",
    protein: "proteinPer100g",
    fat: "fatPer100g",
    carbs: "carbsPer100g",
  };

  const orderBy = {
    [orderByFieldMap[sortByRaw as SortField]]: sortOrderRaw as SortOrder,
  };

  return { where, orderBy };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { where, orderBy } = parseListParams(url);

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: products }, { status: 200 });
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

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        nameNormalized: payload.nameNormalized,
        caloriesPer100g: payload.caloriesPer100g,
        proteinPer100g: payload.proteinPer100g,
        fatPer100g: payload.fatPer100g,
        carbsPer100g: payload.carbsPer100g,
        ingredientsComposition: payload.ingredientsComposition,
        category: payload.category,
        cookingState: payload.cookingState,
        isVegan: payload.isVegan,
        isGlutenFree: payload.isGlutenFree,
        isSugarFree: payload.isSugarFree,
        photos: {
          create: payload.photos.map((photoUrl, index) => ({
            photoUrl,
            sortOrder: index,
          })),
        },
      },
      include: {
        photos: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
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

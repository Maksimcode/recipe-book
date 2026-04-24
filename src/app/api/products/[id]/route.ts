import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateProductPayload = {
  name?: unknown;
  photos?: unknown;
  caloriesPer100g?: unknown;
  proteinPer100g?: unknown;
  fatPer100g?: unknown;
  carbsPer100g?: unknown;
  ingredientsComposition?: unknown;
  category?: unknown;
  cookingState?: unknown;
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

type ProductCategoryValue = (typeof productCategories)[number];

type ProductUpdateData = {
  name?: string;
  nameNormalized?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  ingredientsComposition?: string | null;
  category?: ProductCategoryValue;
  cookingState?: (typeof cookingStates)[number];
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSugarFree?: boolean;
};

function toNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Field "${fieldName}" must be a non-negative number.`);
  }

  return value;
}

function parseUpdatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const data = payload as UpdateProductPayload;
  const updateData: ProductUpdateData = {};
  let photos: string[] | undefined;

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length < 2) {
      throw new Error('Field "name" must be at least 2 characters.');
    }
    updateData.name = data.name.trim();
    updateData.nameNormalized = data.name.trim().toLocaleLowerCase("ru-RU");
  }

  if (data.ingredientsComposition !== undefined) {
    if (data.ingredientsComposition === null) {
      updateData.ingredientsComposition = null;
    } else if (typeof data.ingredientsComposition === "string") {
      updateData.ingredientsComposition =
        data.ingredientsComposition.trim().length > 0 ? data.ingredientsComposition.trim() : null;
    } else {
      throw new Error('Field "ingredientsComposition" must be string or null.');
    }
  }

  if (data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      !productCategories.includes(data.category as ProductCategoryValue)
    ) {
      throw new Error(
        `Field "category" must be one of: ${productCategories.join(", ")}.`,
      );
    }
    updateData.category = data.category as ProductCategoryValue;
  }

  if (data.cookingState !== undefined) {
    if (
      typeof data.cookingState !== "string" ||
      !cookingStates.includes(data.cookingState as (typeof cookingStates)[number])
    ) {
      throw new Error(`Field "cookingState" must be one of: ${cookingStates.join(", ")}.`);
    }
    updateData.cookingState = data.cookingState as (typeof cookingStates)[number];
  }

  if (data.isVegan !== undefined) {
    if (typeof data.isVegan !== "boolean") {
      throw new Error('Field "isVegan" must be a boolean.');
    }
    updateData.isVegan = data.isVegan;
  }

  if (data.isGlutenFree !== undefined) {
    if (typeof data.isGlutenFree !== "boolean") {
      throw new Error('Field "isGlutenFree" must be a boolean.');
    }
    updateData.isGlutenFree = data.isGlutenFree;
  }

  if (data.isSugarFree !== undefined) {
    if (typeof data.isSugarFree !== "boolean") {
      throw new Error('Field "isSugarFree" must be a boolean.');
    }
    updateData.isSugarFree = data.isSugarFree;
  }

  if (data.caloriesPer100g !== undefined) {
    updateData.caloriesPer100g = toNumber(data.caloriesPer100g, "caloriesPer100g");
  }

  if (data.proteinPer100g !== undefined) {
    updateData.proteinPer100g = toNumber(data.proteinPer100g, "proteinPer100g");
  }

  if (data.fatPer100g !== undefined) {
    updateData.fatPer100g = toNumber(data.fatPer100g, "fatPer100g");
  }

  if (data.carbsPer100g !== undefined) {
    updateData.carbsPer100g = toNumber(data.carbsPer100g, "carbsPer100g");
  }

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

  return { updateData, photos };
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

    const product = await prisma.product.findUnique({
      where: { id: id.trim() },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: product }, { status: 200 });
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
    const { updateData, photos } = parseUpdatePayload(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id: id.trim() },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found." } },
        { status: 404 },
      );
    }

    const proteinPer100g =
      updateData.proteinPer100g ?? Number(existingProduct.proteinPer100g);
    const fatPer100g = updateData.fatPer100g ?? Number(existingProduct.fatPer100g);
    const carbsPer100g = updateData.carbsPer100g ?? Number(existingProduct.carbsPer100g);

    if (
      proteinPer100g > 100 ||
      fatPer100g > 100 ||
      carbsPer100g > 100 ||
      proteinPer100g + fatPer100g + carbsPer100g > 100
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid BJU values: protein + fat + carbs must be <= 100.",
          },
        },
        { status: 400 },
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id.trim() },
      data: {
        ...updateData,
        ...(photos
          ? {
              photos: {
                deleteMany: {},
                create: photos.map((photoUrl, index) => ({
                  photoUrl,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: updatedProduct }, { status: 200 });
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

    const productId = id.trim();

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found." } },
        { status: 404 },
      );
    }

    const relatedDishes = await prisma.dishIngredient.findMany({
      where: { productId },
      select: {
        dish: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dish: {
          name: "asc",
        },
      },
    });

    if (relatedDishes.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: "PRODUCT_IN_USE",
            message:
              "Cannot delete product because it is used in one or more dishes.",
            dishes: relatedDishes.map((item: { dish: { id: string; name: string } }) => item.dish),
          },
        },
        { status: 409 },
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ data: { deleted: true, id: productId } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
      { status: 500 },
    );
  }
}

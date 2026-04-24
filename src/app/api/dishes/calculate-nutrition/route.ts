import { NextResponse } from "next/server";

import {
  calculateAutoNutrition,
  calculateBjuPer100gSum,
  calculateFlagsAvailability,
  calculatePer100g,
  findMissingProductIds,
  parseIngredientsInput,
  parseMacroCategory,
  toNonNegativeNumber,
} from "@/lib/dishes/domain";
import { prisma } from "@/lib/prisma";

type IngredientInput = {
  productId: string;
  grams: number;
};

type CalculatePayload = {
  name?: unknown;
  ingredients: unknown;
  portionSizeGrams: unknown;
};

function parsePayload(payload: unknown): {
  name?: string;
  ingredients: IngredientInput[];
  portionSizeGrams: number;
} {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Request body must be a JSON object.");
  }

  const data = payload as CalculatePayload;
  let name: string | undefined;
  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      throw new Error('Field "name" must be a string.');
    }
    name = data.name.trim();
  }

  const ingredients = parseIngredientsInput(data.ingredients);

  const portionSizeGrams = toNonNegativeNumber(data.portionSizeGrams, "portionSizeGrams");
  if (portionSizeGrams <= 0) {
    throw new Error('Field "portionSizeGrams" must be greater than 0.');
  }

  return { name, ingredients, portionSizeGrams };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parsePayload(body);

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

    const bjuPer100gSum = calculateBjuPer100gSum(autoNutrition, payload.portionSizeGrams);
    const per100g = calculatePer100g(autoNutrition, payload.portionSizeGrams);

    const macroResult = payload.name
      ? parseMacroCategory(payload.name)
      : { cleanedName: "", macroCategory: null };

    return NextResponse.json(
      {
        data: {
          autoNutrition,
          per100g: {
            calories: per100g.calories,
            protein: per100g.protein,
            fat: per100g.fat,
            carbs: per100g.carbs,
            bjuSum: bjuPer100gSum,
            isBjuValid: bjuPer100gSum <= 100,
          },
          flagsAvailability: calculateFlagsAvailability(products),
          categoryDetectedFromMacro: macroResult.macroCategory ?? null,
          suggestedName: macroResult.cleanedName,
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

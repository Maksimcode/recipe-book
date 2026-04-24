import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const productsSeed = [
  {
    name: "Куриное филе",
    nameNormalized: "куриное филе",
    caloriesPer100g: 110,
    proteinPer100g: 23,
    fatPer100g: 1.2,
    carbsPer100g: 0,
    ingredientsComposition: "Куриное мясо",
    category: "MEAT" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Гречка",
    nameNormalized: "гречка",
    caloriesPer100g: 343,
    proteinPer100g: 13.3,
    fatPer100g: 3.4,
    carbsPer100g: 71.5,
    ingredientsComposition: "Крупа гречневая",
    category: "GRAINS" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Огурец",
    nameNormalized: "огурец",
    caloriesPer100g: 15,
    proteinPer100g: 0.8,
    fatPer100g: 0.1,
    carbsPer100g: 2.8,
    ingredientsComposition: "Огурец свежий",
    category: "VEGETABLES" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Томаты",
    nameNormalized: "томаты",
    caloriesPer100g: 20,
    proteinPer100g: 1.1,
    fatPer100g: 0.2,
    carbsPer100g: 3.7,
    ingredientsComposition: "Томаты свежие",
    category: "VEGETABLES" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1592841200221-4d8cfda1dd72?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Оливковое масло",
    nameNormalized: "оливковое масло",
    caloriesPer100g: 884,
    proteinPer100g: 0,
    fatPer100g: 100,
    carbsPer100g: 0,
    ingredientsComposition: "Масло оливковое extra virgin",
    category: "LIQUID" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Соль",
    nameNormalized: "соль",
    caloriesPer100g: 0,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 0,
    ingredientsComposition: "Пищевая соль",
    category: "SPICES" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1518110925495-5fe2fda0442f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
] as const;

const extendedProductsSeed = [
  {
    name: "Лосось",
    nameNormalized: "лосось",
    caloriesPer100g: 208,
    proteinPer100g: 20,
    fatPer100g: 13,
    carbsPer100g: 0,
    ingredientsComposition: "Филе лосося",
    category: "MEAT" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Йогурт греческий",
    nameNormalized: "йогурт греческий",
    caloriesPer100g: 97,
    proteinPer100g: 9,
    fatPer100g: 5,
    carbsPer100g: 3.6,
    ingredientsComposition: "Молоко, закваска",
    category: "LIQUID" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Банан",
    nameNormalized: "банан",
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    fatPer100g: 0.3,
    carbsPer100g: 22.8,
    ingredientsComposition: "Банан свежий",
    category: "SWEETS" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: false,
    photos: [
      "https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
] as const;

const dishesSeed = [
  {
    name: "Гречка с курицей",
    nameNormalized: "гречка с курицей",
    category: "SECOND" as const,
    portionSizeGrams: 350,
    caloriesPerPortion: 540,
    proteinPerPortion: 49,
    fatPerPortion: 14,
    carbsPerPortion: 52,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    ],
    ingredients: [
      { productNameNormalized: "куриное филе", grams: 180 },
      { productNameNormalized: "гречка", grams: 120 },
      { productNameNormalized: "соль", grams: 2 },
    ],
  },
  {
    name: "Овощной салат",
    nameNormalized: "овощной салат",
    category: "SALAD" as const,
    portionSizeGrams: 280,
    caloriesPerPortion: 210,
    proteinPerPortion: 4.5,
    fatPerPortion: 14.5,
    carbsPerPortion: 14,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80",
    ],
    ingredients: [
      { productNameNormalized: "огурец", grams: 120 },
      { productNameNormalized: "томаты", grams: 120 },
      { productNameNormalized: "оливковое масло", grams: 12 },
      { productNameNormalized: "соль", grams: 2 },
    ],
  },
] as const;

const extendedDishesSeed = [
  {
    name: "Запеченный лосось",
    nameNormalized: "запеченный лосось",
    category: "SECOND" as const,
    portionSizeGrams: 240,
    caloriesPerPortion: 500,
    proteinPerPortion: 42,
    fatPerPortion: 34,
    carbsPerPortion: 2,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: [
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
    ],
    ingredients: [
      { productNameNormalized: "лосось", grams: 220 },
      { productNameNormalized: "соль", grams: 2 },
      { productNameNormalized: "оливковое масло", grams: 8 },
    ],
  },
  {
    name: "Йогурт с бананом",
    nameNormalized: "йогурт с бананом",
    category: "DESSERT" as const,
    portionSizeGrams: 250,
    caloriesPerPortion: 245,
    proteinPerPortion: 14,
    fatPerPortion: 8,
    carbsPerPortion: 31,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: false,
    photos: [
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    ],
    ingredients: [
      { productNameNormalized: "йогурт греческий", grams: 170 },
      { productNameNormalized: "банан", grams: 80 },
    ],
  },
] as const;

const defenseProductsSeed = [
  {
    name: "Свёкла",
    nameNormalized: "свёкла",
    caloriesPer100g: 43,
    proteinPer100g: 1.6,
    fatPer100g: 0.2,
    carbsPer100g: 9.6,
    ingredientsComposition: "Свёкла свежая",
    category: "VEGETABLES" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/svekla.png"],
  },
  {
    name: "Картофель",
    nameNormalized: "картофель",
    caloriesPer100g: 77,
    proteinPer100g: 2,
    fatPer100g: 0.4,
    carbsPer100g: 16.3,
    ingredientsComposition: "Картофель свежий",
    category: "VEGETABLES" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/kartoshqa.png"],
  },
  {
    name: "Вода",
    nameNormalized: "вода",
    caloriesPer100g: 0,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbsPer100g: 0,
    ingredientsComposition: "Питьевая вода",
    category: "LIQUID" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/water.png"],
  },
  {
    name: "Мясо",
    nameNormalized: "мясо",
    caloriesPer100g: 187.2,
    proteinPer100g: 18.9,
    fatPer100g: 12.4,
    carbsPer100g: 0,
    ingredientsComposition: "Говядина",
    category: "MEAT" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/meat.jpeg", "/meat2.jpeg"],
  },
  {
    name: "Тыква",
    nameNormalized: "тыква",
    caloriesPer100g: 26,
    proteinPer100g: 1,
    fatPer100g: 0.1,
    carbsPer100g: 6.5,
    ingredientsComposition: "Тыква свежая",
    category: "VEGETABLES" as const,
    cookingState: "REQUIRES_COOKING" as const,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/pumpkin.png"],
  },
  {
    name: "Пончик",
    nameNormalized: "пончик",
    caloriesPer100g: 452,
    proteinPer100g: 5.2,
    fatPer100g: 25.3,
    carbsPer100g: 50.1,
    ingredientsComposition: "Мука, сахар, масло",
    category: "SWEETS" as const,
    cookingState: "READY_TO_EAT" as const,
    isVegan: false,
    isGlutenFree: false,
    isSugarFree: false,
    photos: ["/donuts.png"],
  },
] as const;

const defenseDishesSeed = [
  {
    name: "борщ",
    nameNormalized: "борщ",
    category: "SOUP" as const,
    portionSizeGrams: 420,
    caloriesPerPortion: 250,
    proteinPerPortion: 20,
    fatPerPortion: 10,
    carbsPerPortion: 18,
    isVegan: false,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/borsch.png", "/potatoes.png"],
    ingredients: [
      { productNameNormalized: "вода", grams: 250 },
      { productNameNormalized: "свёкла", grams: 80 },
      { productNameNormalized: "картофель", grams: 70 },
      { productNameNormalized: "мясо", grams: 80 },
    ],
  },
  {
    name: "борщ веганский",
    nameNormalized: "борщ веганский",
    category: "SOUP" as const,
    portionSizeGrams: 390,
    caloriesPerPortion: 145,
    proteinPerPortion: 4,
    fatPerPortion: 1,
    carbsPerPortion: 29,
    isVegan: true,
    isGlutenFree: true,
    isSugarFree: true,
    photos: ["/borsch_vegan.png", "/potatoes.png"],
    ingredients: [
      { productNameNormalized: "вода", grams: 250 },
      { productNameNormalized: "свёкла", grams: 80 },
      { productNameNormalized: "картофель", grams: 60 },
    ],
  },
] as const;

async function main() {
  const mode = process.env.SEED_MODE ?? "default";
  const isExtended = mode === "extended";
  const isDefense = mode === "defense";
  const allProductsSeed = isDefense
    ? [...defenseProductsSeed]
    : isExtended
      ? [...productsSeed, ...extendedProductsSeed]
      : [...productsSeed];
  const allDishesSeed = isDefense
    ? [...defenseDishesSeed]
    : isExtended
      ? [...dishesSeed, ...extendedDishesSeed]
      : [...dishesSeed];

  const productNames = allProductsSeed.map((item) => item.nameNormalized);
  const dishNames = allDishesSeed.map((item) => item.nameNormalized);

  await prisma.dish.deleteMany({
    where: { nameNormalized: { in: dishNames } },
  });
  await prisma.product.deleteMany({
    where: { nameNormalized: { in: productNames } },
  });

  const productMap = new Map<string, string>();
  for (const product of allProductsSeed) {
    const created = await prisma.product.create({
      data: {
        name: product.name,
        nameNormalized: product.nameNormalized,
        caloriesPer100g: product.caloriesPer100g,
        proteinPer100g: product.proteinPer100g,
        fatPer100g: product.fatPer100g,
        carbsPer100g: product.carbsPer100g,
        ingredientsComposition: product.ingredientsComposition,
        category: product.category,
        cookingState: product.cookingState,
        isVegan: product.isVegan,
        isGlutenFree: product.isGlutenFree,
        isSugarFree: product.isSugarFree,
        photos: {
          create: product.photos.map((photoUrl, index) => ({ photoUrl, sortOrder: index })),
        },
      },
    });
    productMap.set(product.nameNormalized, created.id);
  }

  for (const dish of allDishesSeed) {
    await prisma.dish.create({
      data: {
        name: dish.name,
        nameNormalized: dish.nameNormalized,
        category: dish.category,
        portionSizeGrams: dish.portionSizeGrams,
        caloriesPerPortion: dish.caloriesPerPortion,
        proteinPerPortion: dish.proteinPerPortion,
        fatPerPortion: dish.fatPerPortion,
        carbsPerPortion: dish.carbsPerPortion,
        isVegan: dish.isVegan,
        isGlutenFree: dish.isGlutenFree,
        isSugarFree: dish.isSugarFree,
        isNutritionManuallyEdited: false,
        photos: {
          create: dish.photos.map((photoUrl, index) => ({ photoUrl, sortOrder: index })),
        },
        ingredients: {
          create: dish.ingredients.map((ingredient) => {
            const productId = productMap.get(ingredient.productNameNormalized);
            if (!productId) {
              throw new Error(`Missing product for ingredient ${ingredient.productNameNormalized}`);
            }
            return {
              productId,
              grams: ingredient.grams,
            };
          }),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seed completed. Mode: ${process.env.SEED_MODE ?? "default"}`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { Recipe, RecipeIngredient } from '@/src/types';

interface RawIngredient {
  name: string;
  amount: string;
  unit: string;
}

interface RawRecipe {
  id: number | string;
  name: string;
  image: string;
  cuisine?: string;
  difficulty?: string;
  cookTime: number | string;
  servings: number;
  ingredients: RawIngredient[];
  instructions: string[];
}

interface RecipesFile {
  recipes: RawRecipe[];
  metadata?: Record<string, any>;
}

const difficultyMap: Record<string, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
};

function mapDifficulty(value?: string): { difficulty: number; label?: string } {
  if (!value) {
    return { difficulty: 3 };
  }

  const normalized = value.trim().toLowerCase();
  return {
    difficulty: difficultyMap[normalized] ?? 3,
    label: value,
  };
}

function formatCookTime(value: number | string): { cookTime: string; minutes?: number } {
  if (typeof value === 'number') {
    return { cookTime: `${value} mins`, minutes: value };
  }

  const parsed = parseInt(value, 10);
  if (!Number.isNaN(parsed)) {
    return { cookTime: `${parsed} mins`, minutes: parsed };
  }

  return { cookTime: value };
}

function mapIngredient(raw: RawIngredient, recipeId: string, index: number): RecipeIngredient {
  const amountParts = [raw.amount, raw.unit].filter(Boolean);
  return {
    id: `${recipeId}-${index + 1}`,
    name: raw.name,
    amount: amountParts.join(' ').trim(),
  };
}

function transformRecipe(raw: RawRecipe): Recipe {
  const recipeId = String(raw.id);
  const { difficulty, label } = mapDifficulty(raw.difficulty);
  const { cookTime, minutes } = formatCookTime(raw.cookTime);

  return {
    id: recipeId,
    name: raw.name,
    image: raw.image,
    difficulty,
    difficultyLabel: label,
    cookTime,
    cookTimeMinutes: minutes,
    servings: raw.servings,
    cuisine: raw.cuisine,
    ingredients: raw.ingredients.map((ingredient, index) =>
      mapIngredient(ingredient, recipeId, index)
    ),
    directions: raw.instructions,
  };
}

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'Recipes.json');
    const fileContents = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContents) as RecipesFile | RawRecipe[];

    const rawRecipes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.recipes)
        ? parsed.recipes
        : [];

    const recipes = rawRecipes.map(transformRecipe);

    return NextResponse.json({
      recipes,
      total: recipes.length,
    });
  } catch (error: any) {
    console.error('Error loading recipes data:', error);
    return NextResponse.json(
      { error: 'Failed to load recipes data', details: error.message },
      { status: 500 }
    );
  }
}

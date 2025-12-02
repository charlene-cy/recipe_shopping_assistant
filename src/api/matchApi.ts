import { RecipeIngredient, WeeeProduct } from '../types';

export interface MatchedProduct extends WeeeProduct {
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface IngredientMatchResult {
  ingredient: RecipeIngredient;
  bestMatch: MatchedProduct | null;
  alternatives: MatchedProduct[];
  candidateCount: number;
}

export interface MatchApiError {
  error: string;
  details?: string;
}

export type MatchLoadingState = 'waiting' | 'loading' | 'matched' | 'error' | 'no_match';

export interface IngredientMatchState {
  ingredient: RecipeIngredient;
  state: MatchLoadingState;
  result?: IngredientMatchResult;
  error?: string;
  selectedProductId?: string; // User's selected product (could be alternative)
  isFromCache?: boolean; // True if this match was loaded from history, false if fresh from API
  isUserSelection?: boolean; // True if user manually selected this product (alternative or manual search)
}

export type UserFeedbackType = 'thumbs_up' | 'thumbs_down' | 'selected_alternative' | 'manual_search' | 'skipped';

export interface IngredientFeedback {
  ingredientName: string;
  recipeId: string;
  recipeName: string;
  bestMatchProductId: string;
  bestMatchConfidence: number;
  userFeedback: UserFeedbackType;
  selectedProductId?: string;
  timestamp: Date;
}

// Log feedback to console for MVP
export function logFeedback(feedback: IngredientFeedback) {
  console.log('📊 User Feedback:', {
    ...feedback,
    timestamp: feedback.timestamp.toISOString(),
  });
}

/**
 * Calls the /api/match endpoint to get AI-powered product matches for an ingredient
 * @param ingredient - The recipe ingredient to match
 * @param products - The available products to match against
 * @param recipeName - Optional recipe name for better matching context
 * @returns Promise with match results including best match and alternatives
 */
export async function matchIngredientToProducts(
  ingredient: RecipeIngredient,
  products: WeeeProduct[],
  recipeName?: string
): Promise<IngredientMatchResult> {
  const response = await fetch('/api/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount,
        recipeName,
      },
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        ingredientId: p.ingredientId,
      })),
      options: {
        maxCandidates: 20,
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as MatchApiError;
    throw new Error(errorData.error || 'Failed to match ingredient');
  }

  const data = await response.json();

  return {
    ingredient,
    bestMatch: data.bestMatch,
    alternatives: data.alternatives,
    candidateCount: data.candidateCount,
  };
}

/**
 * Batch match multiple ingredients to products
 * @param ingredients - Array of recipe ingredients
 * @param products - Available products to match against
 * @param recipeName - Optional recipe name for context
 * @returns Promise with array of match results
 */
export async function matchMultipleIngredients(
  ingredients: RecipeIngredient[],
  products: WeeeProduct[],
  recipeName?: string
): Promise<IngredientMatchResult[]> {
  const matchPromises = ingredients.map(ingredient =>
    matchIngredientToProducts(ingredient, products, recipeName)
  );

  return Promise.all(matchPromises);
}

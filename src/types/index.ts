export interface Recipe {
  id: string;
  name: string;
  image: string;
  difficulty: number; // 1-5
  difficultyLabel?: string;
  cookTime: string;
  cookTimeMinutes?: number;
  servings: number;
  cuisine?: string;
  ingredients: RecipeIngredient[];
  ingredientGroups?: IngredientGroup[];
  directions: string[];
  prepSteps?: string[];
  cookingSteps?: string[];
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
}

export interface IngredientGroup {
  title: string;
  ingredients: RecipeIngredient[];
}

export interface WeeeProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  ingredientId: string; // Links to RecipeIngredient
}

export interface CartItem {
  product: WeeeProduct;
  quantity: number;
  recipeId: string;
  recipeName: string;
}

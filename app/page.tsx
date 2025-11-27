'use client';

import { RecipeSwipePage } from '@/src/components/RecipeSwipePage';
import { Recipe } from '@/src/types';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/app/hooks/useRecipes';

export default function HomePage() {
  const router = useRouter();
  const { recipes, loading, error } = useRecipes();

  const handleRecipeSelect = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <p className="text-gray-600">Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
        <div className="max-w-md text-center space-y-2">
          <p className="text-gray-700 font-medium">Unable to load recipes.</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
        <p className="text-gray-600">No recipes available yet. Please check back soon.</p>
      </div>
    );
  }

  return (
    <RecipeSwipePage
      recipes={recipes}
      onRecipeSelect={handleRecipeSelect}
    />
  );
}






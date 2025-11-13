import { useState } from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/src/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface RecipeSwipePageProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
}

export function RecipeSwipePage({ recipes, onRecipeSelect }: RecipeSwipePageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeRight = () => {
    if (currentIndex < recipes.length) {
      onRecipeSelect(recipes[currentIndex]);
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < recipes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (currentIndex >= recipes.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No more recipes to explore!</p>
          <Button onClick={() => setCurrentIndex(0)}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 lg:p-8">
        <h1 className="text-center text-xl md:text-3xl lg:text-4xl">Discover Recipes</h1>
      </div>

      {/* Card Stack */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-24 md:p-6 md:pt-24 md:pb-32 lg:p-8 lg:pt-28 lg:pb-36">
        <div className="relative w-full max-w-md md:max-w-md lg:max-w-lg h-full">
          {recipes.slice(currentIndex, currentIndex + 2).map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              style={{
                zIndex: 2 - index,
                scale: 1 - index * 0.05,
                opacity: 1 - index * 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
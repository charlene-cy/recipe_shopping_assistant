import { useState } from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/src/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-slate-900 p-4 md:p-6 lg:p-8 relative">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No more recipes to explore!</p>
          <Button onClick={() => setCurrentIndex(0)}>
            Start Over
          </Button>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-900 dark:to-slate-900 relative overflow-hidden transition-colors">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 lg:p-8">
        <h1 className="text-center text-xl md:text-3xl lg:text-4xl dark:text-white">Hi Charlene! Ready to cook?</h1>
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

      {/* Theme Toggle at Bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <ThemeToggle />
      </div>
    </div>
  );
}
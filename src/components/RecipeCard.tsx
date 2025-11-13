import { Star } from 'lucide-react';
import { Recipe } from '@/src/types';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RecipeCardProps {
  recipe: Recipe;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  style?: React.CSSProperties;
}

export function RecipeCard({ recipe, onSwipeRight, onSwipeLeft, style }: RecipeCardProps) {
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={style}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.05 }}
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
        <div className="relative h-48 md:h-64 lg:h-72">
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        
        <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="mb-2 md:mb-3 text-lg md:text-xl lg:text-2xl">{recipe.name}</h2>
            
            <div className="flex items-center gap-1 mb-4">
              <span className="text-gray-600 mr-2">Difficulty:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < recipe.difficulty
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-4 text-gray-600">
              <span>⏱️ {recipe.cookTime}</span>
              <span>🍽️ {recipe.servings} servings</span>
            </div>
          </div>

          <p className="text-gray-400 text-center mt-4">
            Swipe right to view • Swipe left to skip
          </p>
        </div>
      </div>
    </motion.div>
  );
}
import { Recipe } from '@/src/types';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

interface RecipeCardProps {
  recipe: Recipe;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  style?: React.CSSProperties;
}

const difficultyLevels = [
  { label: '🍃 Super Beginner-friendly', color: '#48BB78' },
  { label: '👌 Easy', color: '#4299E1' },
  { label: '👍 Medium', color: '#F6AD55' },
  { label: '🔥 Challenging', color: '#FF6B35' },
  { label: '👨‍🍳 Master', color: '#990000' },
];

export function RecipeCard({ recipe, onSwipeRight, onSwipeLeft, style }: RecipeCardProps) {
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      onSwipeLeft();
    }
  };

  const difficultyLevel = difficultyLevels[recipe.difficulty - 1] || difficultyLevels[2];

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={style}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.05 }}
    >
      <div className="rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col" style={{ backgroundColor: '#e4dec6ff' }}>
        <div className="relative" style={{ height: '68%' }}>
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="mb-3 md:mb-4 uppercase" style={{
              fontFamily: 'Georgia, serif',
              fontSize: '28px',
              color: '#ed8654ff',
              fontWeight: 'bold'
            }}>
              {recipe.name}
            </h2>

            <div className="mb-4">
              <span style={{ color: difficultyLevel.color, fontWeight: '600' }}>
                {difficultyLevel.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={onSwipeRight}
              className="w-full"
            >
              View Recipe
            </Button>
            <p className="text-gray-600 text-center text-sm">
              Swipe right to view • Swipe left to skip
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
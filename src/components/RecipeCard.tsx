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
      <div className="rounded-3xl overflow-hidden h-full flex flex-col bg-[#e4dec6]" style={{
        boxShadow: 'var(--shadow-2xl)'
      }}>
        {/* Image Section - 60% height */}
        <div className="relative" style={{ height: '60%' }}>
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Amy's Kitchen watermark */}
          <div className="absolute top-4 right-4 text-white font-serif italic text-xl opacity-90">
            Amy's Kitchen
          </div>
        </div>

        {/* Content Section - 40% height */}
        <div className="px-6 py-6 flex-1 flex flex-col justify-between" style={{ minHeight: '40%' }}>
          <div className="space-y-3">
            <h2 className="uppercase font-bold tracking-wide" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
              color: '#C65D2E',
              lineHeight: '1.2',
              letterSpacing: '0.02em'
            }}>
              {recipe.name}
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-2xl">👌</span>
              <span className="text-primary font-semibold text-base">
                {difficultyLevel.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={onSwipeRight}
              className="w-full bg-[#C65D2E] hover:bg-[#B54D1E] text-white font-medium py-6 text-base rounded-lg transition-colors"
              style={{
                boxShadow: 'var(--shadow-md)'
              }}
            >
              View Recipe
            </Button>
            <p className="text-gray-600 text-center text-sm font-normal">
              Swipe right to view • Swipe left to skip
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { RecipeCard } from './RecipeCard';
import { Recipe } from '@/src/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface RecipeSwipePageProps {
  recipes: Recipe[];
  onRecipeSelect: (recipe: Recipe) => void;
}

export function RecipeSwipePage({ recipes, onRecipeSelect }: RecipeSwipePageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Secret developer feature - tap counter
  const [tapCount, setTapCount] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Reset tap counter after 3 seconds of inactivity
  useEffect(() => {
    if (tapCount > 0) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      tapTimeoutRef.current = setTimeout(() => {
        console.log('[Secret] Tap counter reset due to timeout');
        setTapCount(0);
      }, 3000);
    }

    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [tapCount]);

  // Handle tap on "Charlene" text
  const handleNameTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    console.log(`[Secret] Tap ${newCount}/10`);

    // Halfway point - visual feedback
    if (newCount === 5) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      console.log('[Secret] Halfway there! 5 more taps...');
    }

    // 10 taps reached - show confirmation dialog
    if (newCount >= 10) {
      console.log('[Secret] 10 taps reached! Showing confirmation dialog');
      setShowClearDialog(true);
      setTapCount(0); // Reset counter
    }
  };

  // Clear all localStorage data
  const handleClearAllData = () => {
    console.log('[Secret] Clearing all data...');

    try {
      // Clear match history
      localStorage.removeItem('ingredient_match_history');

      // Clear cart items
      localStorage.removeItem('cartItems');

      // Clear any other app-related localStorage entries
      // You can add more specific keys here if needed
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('ingredient') ||
          key.includes('cart') ||
          key.includes('recipe') ||
          key.includes('match')
        )) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        console.log(`[Secret] Removing: ${key}`);
        localStorage.removeItem(key);
      });

      setShowClearDialog(false);

      // Show success message
      toast.success('All data cleared successfully', {
        description: 'Match history and shopping cart have been deleted',
      });

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('[Secret] Error clearing data:', error);
      toast.error('Failed to clear data', {
        description: 'Please try again or check the console',
      });
    }
  };

  // Reset tap counter when user clicks elsewhere
  const handleBackgroundClick = () => {
    if (tapCount > 0) {
      console.log('[Secret] Tap counter reset - clicked elsewhere');
      setTapCount(0);
    }
  };

  if (currentIndex >= recipes.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-white to-white dark:from-gray-900 dark:to-slate-900 p-4 md:p-6 lg:p-8 relative">
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
    <>
      <div
        className="min-h-screen bg-gradient-to-br from-white via-white to-white dark:from-gray-900 dark:to-slate-900 relative overflow-hidden transition-colors"
        onClick={handleBackgroundClick}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 py-6 md:px-8 md:py-8">
          <h1 className="text-center text-xl md:text-2xl font-normal text-gray-900 dark:text-white leading-tight max-w-xs mx-auto">
            Hi{' '}
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleNameTap();
              }}
              className={`cursor-default select-none transition-all duration-200 ${
                isFlashing ? 'text-red-500 scale-110' : ''
              }`}
            >
              Charlene
            </span>
            !<br />Ready to cook?
          </h1>
        </div>

        {/* Card Stack */}
        <div className="absolute inset-0 flex items-center justify-center px-5 pt-20 pb-4 md:px-6 md:pt-36 md:pb-24">
          <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl h-full">
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all match history and shopping cart items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
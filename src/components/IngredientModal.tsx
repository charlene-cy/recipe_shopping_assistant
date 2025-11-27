import { useState, useEffect } from 'react';
import { Recipe, WeeeProduct } from '@/src/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { matchIngredientToProducts, type IngredientMatchState } from '@/src/api/matchApi';
import { IngredientMatchCard } from './IngredientMatchCard';
import { ManualSearchModal } from './ManualSearchModal';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  products: WeeeProduct[];
  cartQuantities: Map<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (products: WeeeProduct[]) => void;
}

export function IngredientModal({
  isOpen,
  onClose,
  recipe,
  products,
  cartQuantities,
  onQuantityChange,
  onAddToCart
}: IngredientModalProps) {
  const [matchStates, setMatchStates] = useState<Map<string, IngredientMatchState>>(new Map());
  const [manualSearchIngredient, setManualSearchIngredient] = useState<string | null>(null);

  // Initialize all ingredients as "waiting" when modal opens
  useEffect(() => {
    if (isOpen && products.length > 0) {
      // Initialize states
      const initialStates = new Map<string, IngredientMatchState>();
      recipe.ingredients.forEach((ingredient) => {
        initialStates.set(ingredient.id, {
          ingredient,
          state: 'waiting',
        });
      });
      setMatchStates(initialStates);

      // Start matching all ingredients in parallel
      fetchAllMatches();
    }
  }, [isOpen, recipe.id]);

  const fetchAllMatches = async () => {
    // Match all ingredients in parallel
    recipe.ingredients.forEach((ingredient) => {
      fetchSingleMatch(ingredient.id);
    });
  };

  const fetchSingleMatch = async (ingredientId: string) => {
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    // Set to loading
    setMatchStates((prev) => {
      const updated = new Map(prev);
      updated.set(ingredientId, {
        ingredient,
        state: 'loading',
      });
      return updated;
    });

    try {
      const result = await matchIngredientToProducts(ingredient, products, recipe.name);

      // Update with result
      setMatchStates((prev) => {
        const updated = new Map(prev);
        updated.set(ingredientId, {
          ingredient,
          state: result.bestMatch ? 'matched' : 'no_match',
          result,
        });
        return updated;
      });
    } catch (err) {
      console.error(`Failed to match ${ingredient.name}:`, err);

      // Update with error
      setMatchStates((prev) => {
        const updated = new Map(prev);
        updated.set(ingredientId, {
          ingredient,
          state: 'error',
          error: err instanceof Error ? err.message : 'Failed to match',
        });
        return updated;
      });
    }
  };

  const handleRetry = (ingredientId: string) => {
    fetchSingleMatch(ingredientId);
  };

  const handleManualSearch = (ingredientId: string) => {
    setManualSearchIngredient(ingredientId);
  };

  const handleManualSelect = (product: WeeeProduct) => {
    const ingredient = recipe.ingredients.find(i => i.id === manualSearchIngredient);
    if (!ingredient) return;

    // Create a matched result for the manually selected product
    setMatchStates((prev) => {
      const updated = new Map(prev);
      updated.set(ingredient.id, {
        ingredient,
        state: 'matched',
        result: {
          ingredient,
          bestMatch: {
            ...product,
            confidence: 100,
            confidenceLabel: 'high',
            reasoning: 'Manually selected by user',
          },
          alternatives: [],
          candidateCount: 1,
        },
      });
      return updated;
    });

    toast.success(`Selected ${product.name}`);
    setManualSearchIngredient(null);
  };

  const handleSkip = (ingredientId: string) => {
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    setMatchStates((prev) => {
      const updated = new Map(prev);
      updated.set(ingredientId, {
        ingredient,
        state: 'no_match',
      });
      return updated;
    });

    toast.info(`Skipped ${ingredient.name}`);
  };

  const handleAddAllToCart = () => {
    const matchedProducts: WeeeProduct[] = [];

    matchStates.forEach((matchState) => {
      if (matchState.state === 'matched' && matchState.result?.bestMatch) {
        matchedProducts.push(matchState.result.bestMatch);
      }
    });

    if (matchedProducts.length === 0) {
      toast.error('No products to add');
      return;
    }

    onAddToCart(matchedProducts);
    toast.success(`Added ${matchedProducts.length} items to cart`);
  };

  // Calculate progress
  const totalIngredients = recipe.ingredients.length;
  const matchedCount = Array.from(matchStates.values()).filter(
    (s) => s.state === 'matched'
  ).length;
  const matchedProducts = Array.from(matchStates.values())
    .filter((s) => s.state === 'matched' && s.result?.bestMatch)
    .map((s) => s.result!.bestMatch!);

  const totalPrice = matchedProducts.reduce((sum, p) => sum + p.price, 0);
  const isLoading = Array.from(matchStates.values()).some((s) => s.state === 'loading' || s.state === 'waiting');

  // Get manual search ingredient
  const manualIngredient = manualSearchIngredient
    ? recipe.ingredients.find(i => i.id === manualSearchIngredient)
    : null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle>AI Product Matching</SheetTitle>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">{recipe.name}</p>
                <p className="text-blue-600 font-medium">
                  {matchedCount} of {totalIngredients} matched
                </p>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {recipe.ingredients.map((ingredient) => {
                const matchState = matchStates.get(ingredient.id) || {
                  ingredient,
                  state: 'waiting' as const,
                };

                return (
                  <IngredientMatchCard
                    key={ingredient.id}
                    matchState={matchState}
                    recipeId={recipe.id}
                    recipeName={recipe.name}
                    cartQuantity={matchState.result?.bestMatch
                      ? cartQuantities.get(matchState.result.bestMatch.id) || 0
                      : 0
                    }
                    onQuantityChange={onQuantityChange}
                    onRetry={() => handleRetry(ingredient.id)}
                    onManualSearch={() => handleManualSearch(ingredient.id)}
                    onSkip={() => handleSkip(ingredient.id)}
                  />
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t bg-white">
              <div className="mb-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {matchedCount} of {totalIngredients} items
                  </p>
                  {isLoading && (
                    <p className="text-xs text-blue-600 mt-0.5">Matching in progress...</p>
                  )}
                </div>
                <p className="text-red-500 font-medium text-lg">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleAddAllToCart}
                disabled={matchedCount === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add {matchedCount > 0 ? `${matchedCount} ` : ''}Items to Cart
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manual Search Modal */}
      {manualIngredient && (
        <ManualSearchModal
          isOpen={!!manualSearchIngredient}
          onClose={() => setManualSearchIngredient(null)}
          ingredient={manualIngredient}
          products={products}
          onSelect={handleManualSelect}
        />
      )}
    </>
  );
}

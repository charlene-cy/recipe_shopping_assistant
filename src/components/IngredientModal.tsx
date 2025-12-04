import { useState, useEffect } from 'react';
import { Recipe, WeeeProduct } from '@/src/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { matchIngredientToProducts, type IngredientMatchState } from '@/src/api/matchApi';
import { IngredientMatchCard } from './IngredientMatchCard';
import { ManualSearchModal } from './ManualSearchModal';
import { useMatchHistory } from '@/src/hooks/useMatchHistory';

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
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0); // Force re-render on cart changes
  const matchHistory = useMatchHistory();

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

  // Watch for cart quantity changes and update match history
  useEffect(() => {
    if (!matchHistory.isLoaded) return;

    matchStates.forEach((matchState) => {
      if (matchState.state === 'matched' && matchState.result?.bestMatch) {
        const productId = matchState.result.bestMatch.id;
        const quantityInCart = cartQuantities.get(productId) || 0;

        // If item is now in cart, mark as added
        if (quantityInCart > 0) {
          matchHistory.markAsAddedToCart(
            matchState.ingredient.name,
            productId
          );
        }
      }
    });

    // Trigger re-render when cart changes
    setCartUpdateTrigger(prev => prev + 1);
  }, [cartQuantities, matchHistory.isLoaded]);

  const fetchAllMatches = async () => {
    // Match all ingredients in parallel
    recipe.ingredients.forEach((ingredient) => {
      fetchSingleMatch(ingredient.id);
    });
  };

  const fetchSingleMatch = async (ingredientId: string, forceRefresh = false) => {
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    // Check if we have a match in history (unless forcing refresh)
    if (!forceRefresh && matchHistory.isLoaded) {
      const historyEntry = matchHistory.getMatch(ingredient.name);

      if (historyEntry) {
        console.log('[IngredientModal] Using cached match for:', ingredient.name);

        // Find the full product from our products list
        const cachedProduct = products.find(p => p.id === historyEntry.productId);

        if (cachedProduct) {
          // Reconstruct the match from history
          setMatchStates((prev) => {
            const updated = new Map(prev);
            updated.set(ingredientId, {
              ingredient,
              state: 'matched',
              isFromCache: true, // ✅ Mark as loaded from cache
              result: {
                ingredient,
                bestMatch: {
                  ...cachedProduct,
                  confidence: historyEntry.confidence,
                  confidenceLabel: historyEntry.confidenceLabel,
                  reasoning: historyEntry.reasoning,
                },
                alternatives: historyEntry.alternatives
                  .map(alt => products.find(p => p.id === alt.productId))
                  .filter((p): p is WeeeProduct => p !== undefined)
                  .map(p => ({
                    ...p,
                    confidence: historyEntry.alternatives.find(a => a.productId === p.id)?.confidence || 70,
                    confidenceLabel: 'medium' as const,
                    reasoning: 'Previously matched alternative',
                  })),
                candidateCount: 1,
              },
            });
            return updated;
          });

          return; // Exit early, using cached match
        }
      }
    }

    // No history found or forcing refresh - fetch from API
    console.log('[IngredientModal] Fetching fresh match for:', ingredient.name);

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

      // Save to history if we got a match
      if (result.bestMatch) {
        matchHistory.saveMatch(ingredient.name, result.bestMatch, result.alternatives);
      }

      // Update with result
      setMatchStates((prev) => {
        const updated = new Map(prev);
        updated.set(ingredientId, {
          ingredient,
          state: result.bestMatch ? 'matched' : 'no_match',
          isFromCache: false, // ✅ Mark as fresh from API
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
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
      // Clear match from history to force fresh API call
      matchHistory.clearMatch(ingredient.name);
    }
    // Force refresh by passing true
    fetchSingleMatch(ingredientId, true);
  };

  const handleManualSearch = (ingredientId: string) => {
    setManualSearchIngredient(ingredientId);
  };

  const handleManualSelect = (product: WeeeProduct, ingredientId: string) => {
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    const manualMatch = {
      ...product,
      confidence: 100,
      confidenceLabel: 'high' as const,
      reasoning: `This product matches the ingredient "${ingredient.name}" based on your selection. You chose this as the best fit for your recipe.`,
    };

    // Save to history
    matchHistory.saveMatch(ingredient.name, manualMatch, []);

    // Create a matched result for the manually selected product
    // Preserve original alternatives from the AI match so user can still switch back
    setMatchStates((prev) => {
      const updated = new Map(prev);
      const currentState = prev.get(ingredient.id);
      const existingAlternatives = currentState?.result?.alternatives || [];
      const existingBestMatch = currentState?.result?.bestMatch;

      // If we had an existing best match, add it to alternatives so user can switch back
      const alternativesWithPrevious = existingBestMatch && existingBestMatch.id !== product.id
        ? [existingBestMatch, ...existingAlternatives]
        : existingAlternatives;

      updated.set(ingredient.id, {
        ingredient,
        state: 'matched',
        isFromCache: false, // ✅ Manual selection is treated as fresh
        isUserSelection: true, // ✅ User manually selected this
        result: {
          ingredient,
          bestMatch: manualMatch,
          alternatives: alternativesWithPrevious, // Preserve alternatives so user can change their mind
          candidateCount: currentState?.result?.candidateCount || 1,
        },
        collapseAlternatives: true, // ✅ Signal to collapse alternatives
      });
      return updated;
    });

    toast.success(`Selected ${product.name}`);

    // Close the manual search modal AFTER a brief delay to prevent the IngredientModal from closing
    // This prevents the Sheet's onOpenChange from being triggered by the ManualSearchModal closing
    setTimeout(() => {
      setManualSearchIngredient(null);
    }, 100);
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

  const handleAlternativeSelected = (ingredientId: string, productId: string) => {
    const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
    const matchState = matchStates.get(ingredientId);

    if (!ingredient || !matchState?.result) return;

    // Find the selected product (could be in alternatives)
    const selectedProduct = matchState.result.alternatives.find(p => p.id === productId);

    if (selectedProduct) {
      // Update match history with the new selection
      matchHistory.updateMatch(ingredient.name, selectedProduct);

      // Mark this matchState as user selection
      setMatchStates((prev) => {
        const updated = new Map(prev);
        const current = prev.get(ingredientId);
        if (current) {
          updated.set(ingredientId, {
            ...current,
            isUserSelection: true, // ✅ User selected an alternative
          });
        }
        return updated;
      });
    }
  };

  const handleAddAllToCart = () => {
    const matchedProducts: WeeeProduct[] = [];

    matchStates.forEach((matchState) => {
      if (matchState.state === 'matched' && matchState.result?.bestMatch) {
        matchedProducts.push(matchState.result.bestMatch);

        // Mark as added to cart in history
        matchHistory.markAsAddedToCart(
          matchState.ingredient.name,
          matchState.result.bestMatch.id
        );
      }
    });

    if (matchedProducts.length === 0) {
      toast.error('No products to add');
      return;
    }

    onAddToCart(matchedProducts);
    toast.success(`Added ${matchedProducts.length} items to cart`);

    // Force re-render to update status badges
    setCartUpdateTrigger(prev => prev + 1);
  };

  // Calculate progress
  const totalIngredients = recipe.ingredients.length;
  const completedCount = Array.from(matchStates.values()).filter(
    (s) => s.state === 'matched' || s.state === 'no_match' || s.state === 'error'
  ).length;
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
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          // Only allow closing if ManualSearchModal is not open
          if (!open && !manualSearchIngredient) {
            onClose();
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-3xl p-0"
          onInteractOutside={(e) => {
            // Prevent closing if ManualSearchModal is open
            if (manualSearchIngredient) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle>AI Product Matching</SheetTitle>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">{recipe.name}</p>
                <p className="text-blue-600 font-medium">
                  {completedCount < totalIngredients
                    ? `Matching ${completedCount} of ${totalIngredients}...`
                    : `${matchedCount} of ${totalIngredients} matched`
                  }
                </p>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {recipe.ingredients.map((ingredient) => {
                const matchState = matchStates.get(ingredient.id) || {
                  ingredient,
                  state: 'waiting' as const,
                };

                // Get match history for this ingredient
                const historyEntry = matchHistory.getMatch(ingredient.name);

                // Determine match status
                // ✅ FIX: Only show "Previously Matched" if this result was loaded FROM cache
                // If isFromCache=false, it's a fresh API result (even if we just saved it to history)
                let matchStatus: 'ai_matched' | 'previously_matched' | 'your_choice' | 'user_choice' = 'ai_matched';

                // Check if user manually selected this product
                if (matchState.isUserSelection) {
                  matchStatus = 'user_choice';
                } else if (matchState.isFromCache && historyEntry) {
                  // This match was loaded from cache, so show appropriate historical status
                  if (historyEntry.addedToCart) {
                    matchStatus = 'your_choice';
                  } else {
                    matchStatus = 'previously_matched';
                  }
                }
                // Otherwise: isFromCache=false → fresh API result → show "AI Matched"

                // Debug logging
                if (matchState.state === 'matched') {
                  console.log(`[Status Badge] ${ingredient.name}:`, {
                    isFromCache: matchState.isFromCache,
                    isUserSelection: matchState.isUserSelection,
                    hasHistory: !!historyEntry,
                    addedToCart: historyEntry?.addedToCart,
                    finalStatus: matchStatus,
                  });
                }

                // Get timestamp from history if available
                const matchedTimestamp = historyEntry
                  ? new Date(historyEntry.timestamp)
                  : undefined;

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
                    onAlternativeSelected={(productId) => handleAlternativeSelected(ingredient.id, productId)}
                    matchStatus={matchStatus}
                    matchedTimestamp={matchedTimestamp}
                    wasAddedToCart={historyEntry?.addedToCart || false}
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
      {manualIngredient && manualSearchIngredient && (
        <ManualSearchModal
          isOpen={!!manualSearchIngredient}
          onClose={() => setManualSearchIngredient(null)}
          ingredient={manualIngredient}
          products={products}
          onSelect={(product) => handleManualSelect(product, manualSearchIngredient)}
        />
      )}
    </>
  );
}

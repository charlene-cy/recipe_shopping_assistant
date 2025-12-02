import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, Check, Search, X, Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddIngredientButton } from './AddIngredientButton';
import {
  IngredientMatchState,
  MatchedProduct,
  logFeedback,
} from '@/src/api/matchApi';
import { cn } from './ui/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type MatchStatus = 'ai_matched' | 'previously_matched' | 'your_choice' | 'user_choice';

interface IngredientMatchCardProps {
  matchState: IngredientMatchState;
  recipeId: string;
  recipeName: string;
  cartQuantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRetry: () => void;
  onManualSearch: () => void;
  onSkip: () => void;
  onAlternativeSelected?: (productId: string) => void; // Callback when alternative selected
  matchStatus?: MatchStatus; // New prop to indicate match status
  matchedTimestamp?: Date; // When this match was created
  wasAddedToCart?: boolean; // Whether user previously added this to cart
}

export function IngredientMatchCard({
  matchState,
  recipeId,
  recipeName,
  cartQuantity,
  onQuantityChange,
  onRetry,
  onManualSearch,
  onSkip,
  onAlternativeSelected,
  matchStatus = 'ai_matched',
  matchedTimestamp,
  wasAddedToCart = false,
}: IngredientMatchCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  const { ingredient, state, result } = matchState;
  const bestMatch = result?.bestMatch;
  const alternatives = result?.alternatives || [];
  const hasAlternatives = alternatives.length > 0;

  // Get selected product (could be best match or alternative)
  const selectedProduct = selectedProductId
    ? alternatives.find(p => p.id === selectedProductId) || bestMatch
    : bestMatch;

  // Determine the actual match status to display
  const displayStatus: MatchStatus = wasAddedToCart
    ? 'your_choice'
    : matchStatus;

  const getStatusConfig = () => {
    switch (displayStatus) {
      case 'ai_matched':
        return {
          title: '🤖 AI Matched',
          showRematch: false,
        };
      case 'previously_matched':
        return {
          title: '💾 Previously Matched',
          showRematch: true,
        };
      case 'your_choice':
        return {
          title: '✨ Your Choice',
          showRematch: true,
        };
      case 'user_choice':
        return {
          title: '✨ Your Choice',
          showRematch: false,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleAlternativeSelect = (productId: string) => {
    setSelectedProductId(productId);

    // Notify parent component about alternative selection
    if (onAlternativeSelected) {
      onAlternativeSelected(productId);
    }

    if (bestMatch) {
      logFeedback({
        ingredientName: ingredient.name,
        recipeId,
        recipeName,
        bestMatchProductId: bestMatch.id,
        bestMatchConfidence: bestMatch.confidence,
        userFeedback: 'selected_alternative',
        selectedProductId: productId,
        timestamp: new Date(),
      });
    }
  };

  const handleManualSearch = () => {
    if (bestMatch) {
      logFeedback({
        ingredientName: ingredient.name,
        recipeId,
        recipeName,
        bestMatchProductId: bestMatch.id,
        bestMatchConfidence: bestMatch.confidence,
        userFeedback: 'manual_search',
        timestamp: new Date(),
      });
    }
    onManualSearch();
  };

  const handleSkipIngredient = () => {
    if (bestMatch) {
      logFeedback({
        ingredientName: ingredient.name,
        recipeId,
        recipeName,
        bestMatchProductId: bestMatch.id,
        bestMatchConfidence: bestMatch.confidence,
        userFeedback: 'skipped',
        timestamp: new Date(),
      });
    }
    setIsSkipped(true);
    setShowAlternatives(false);
  };

  const handleUndoSkip = () => {
    setIsSkipped(false);
  };

  const handleRematch = () => {
    onRetry();
  };

  // Waiting state
  if (state === 'waiting') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-sm text-gray-500">{ingredient.amount}</p>
          </div>
          <p className="text-sm text-gray-400">Waiting to match...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (state === 'loading') {
    return (
      <div className="bg-white border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-sm text-gray-500">{ingredient.amount}</p>
          </div>
          <p className="text-sm text-blue-600">Finding best match...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-sm text-gray-500 mb-2">{ingredient.amount}</p>
            <p className="text-sm text-red-600 mb-3">{matchState.error || 'Failed to find match'}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
              <Button size="sm" variant="outline" onClick={handleManualSearch}>
                Search Manually
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSkipIngredient}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No match state
  if (state === 'no_match' || !bestMatch) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{ingredient.name}</p>
            <p className="text-sm text-gray-500 mb-2">{ingredient.amount}</p>
            <p className="text-sm text-gray-600 mb-3">No match found</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleManualSearch}>
                <Search className="w-4 h-4 mr-1" />
                Search Manually
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSkipIngredient}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Skipped state (minimized with undo)
  if (isSkipped) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{ingredient.name}</span> • Skipped
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndoSkip}
            className="flex items-center gap-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
        </div>
      </div>
    );
  }

  // Matched state
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* SECTION 1: Ingredient Header Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Ingredient name and amount */}
          <p className="text-sm text-gray-600 font-medium">
            {ingredient.name} • {ingredient.amount}
          </p>

          {/* Right: Why match button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMatchDialog(true)}
            className="text-xs px-2 py-1 h-auto shrink-0"
          >
            Why match?
          </Button>
        </div>

        {/* SECTION 2: Product Information + Add to Cart */}
        <div className="flex gap-3 items-start">
          {/* Part 1: Product Image */}
          <div className="flex-shrink-0">
            <ImageWithFallback
              src={selectedProduct?.image || ''}
              alt={selectedProduct?.name || ''}
              className="w-20 h-20 object-cover rounded-xl"
            />
          </div>

          {/* Part 2: Product Details (flexible width) */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Product name - can wrap to 2 lines max */}
            <h3 className="font-medium text-sm line-clamp-2 mb-1 pr-2">
              {selectedProduct?.name}
            </h3>

            {/* Price and Add Button Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Price */}
              <p className="text-red-500 font-semibold text-base">
                ${selectedProduct?.price.toFixed(2)}
              </p>

              {/* Part 3: Add to Cart Button - Fixed position, reserved space */}
              <div className="flex-shrink-0">
                <AddIngredientButton
                  quantity={cartQuantity}
                  onQuantityChange={(qty) => onQuantityChange(selectedProduct?.id || bestMatch.id, qty)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Alternatives Toggle */}
        {hasAlternatives && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium w-full"
            >
              {showAlternatives ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide alternatives
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  See {alternatives.length} {alternatives.length === 1 ? 'alternative' : 'alternatives'}
                </>
              )}
            </button>

            {/* Alternatives List */}
            {showAlternatives && (
              <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                {/* Best match in list (if not already selected) */}
                {!selectedProductId && (
                  <label className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100">
                    <input
                      type="radio"
                      name={`alternative-${ingredient.id}`}
                      checked={!selectedProductId}
                      onChange={() => setSelectedProductId(null)}
                      className="mt-1"
                    />
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={bestMatch.image}
                        alt={bestMatch.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium">Best match (current)</p>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-1">{bestMatch.name}</p>
                      <p className="text-sm text-red-500 font-medium">${bestMatch.price.toFixed(2)}</p>
                    </div>
                  </label>
                )}

                {/* Alternative products */}
                {alternatives.map((alt) => (
                  <label
                    key={alt.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="radio"
                      name={`alternative-${ingredient.id}`}
                      checked={selectedProductId === alt.id}
                      onChange={() => handleAlternativeSelect(alt.id)}
                      className="mt-1"
                    />
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={alt.image}
                        alt={alt.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{alt.name}</p>
                      <p className="text-sm text-red-500 font-medium mt-0.5">${alt.price.toFixed(2)}</p>
                    </div>
                  </label>
                ))}

                {/* Manual search option */}
                <button
                  onClick={handleManualSearch}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  <Search className="w-4 h-4" />
                  Search all products manually
                </button>

                {/* Skip ingredient button */}
                <button
                  onClick={handleSkipIngredient}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-medium"
                >
                  🚫 None of these work? Skip this ingredient
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Why This Match Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Why This Match?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Image */}
            <div className="flex justify-center">
              <ImageWithFallback
                src={selectedProduct?.image || ''}
                alt={selectedProduct?.name || ''}
                className="w-40 h-40 object-cover rounded-xl"
              />
            </div>

            {/* Product Name */}
            <div>
              <h3 className="font-semibold text-lg text-center">{selectedProduct?.name}</h3>
            </div>

            {/* Match Status Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {statusConfig.title}
              </span>
            </div>

            {/* Explanation */}
            {selectedProduct?.reasoning && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Why this product?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedProduct.reasoning}</p>
              </div>
            )}

            {/* Matched timestamp if available */}
            {matchedTimestamp && (
              <p className="text-xs text-gray-500 text-center">
                Matched on {matchedTimestamp.toLocaleDateString()} at {matchedTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

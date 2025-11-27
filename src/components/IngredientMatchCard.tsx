import { useState } from 'react';
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Loader2, AlertCircle, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddIngredientButton } from './AddIngredientButton';
import {
  IngredientMatchState,
  MatchedProduct,
  logFeedback,
  type IngredientFeedback
} from '@/src/api/matchApi';
import { cn } from './ui/utils';

interface IngredientMatchCardProps {
  matchState: IngredientMatchState;
  recipeId: string;
  recipeName: string;
  cartQuantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRetry: () => void;
  onManualSearch: () => void;
  onSkip: () => void;
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
}: IngredientMatchCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [thumbsUpActive, setThumbsUpActive] = useState(false);
  const [thumbsDownActive, setThumbsDownActive] = useState(false);
  const [showFeedbackMessage, setShowFeedbackMessage] = useState(false);

  const { ingredient, state, result } = matchState;
  const bestMatch = result?.bestMatch;
  const alternatives = result?.alternatives || [];
  const hasAlternatives = alternatives.length > 0;

  // Get selected product (could be best match or alternative)
  const selectedProduct = selectedProductId
    ? alternatives.find(p => p.id === selectedProductId) || bestMatch
    : bestMatch;

  const getConfidenceBadge = (confidence: number, label: 'high' | 'medium' | 'low') => {
    const badges = {
      high: { color: 'bg-green-100 text-green-700', text: 'Excellent match' },
      medium: { color: 'bg-yellow-100 text-yellow-700', text: 'Good match' },
      low: { color: 'bg-orange-100 text-orange-700', text: 'Fair match' },
    };

    if (confidence < 40) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
          Weak match
        </span>
      );
    }

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${badges[label].color}`}>
        {badges[label].text} • {confidence}%
      </span>
    );
  };

  const handleThumbsUp = () => {
    if (!bestMatch) return;

    setThumbsUpActive(true);
    setShowFeedbackMessage(true);
    setShowAlternatives(false);

    logFeedback({
      ingredientName: ingredient.name,
      recipeId,
      recipeName,
      bestMatchProductId: bestMatch.id,
      bestMatchConfidence: bestMatch.confidence,
      userFeedback: 'thumbs_up',
      timestamp: new Date(),
    });

    setTimeout(() => {
      setThumbsUpActive(false);
      setShowFeedbackMessage(false);
    }, 2000);
  };

  const handleThumbsDown = () => {
    if (!bestMatch) return;

    setThumbsDownActive(true);
    setShowAlternatives(true);

    logFeedback({
      ingredientName: ingredient.name,
      recipeId,
      recipeName,
      bestMatchProductId: bestMatch.id,
      bestMatchConfidence: bestMatch.confidence,
      userFeedback: 'thumbs_down',
      timestamp: new Date(),
    });

    setTimeout(() => setThumbsDownActive(false), 500);
  };

  const handleAlternativeSelect = (productId: string) => {
    setSelectedProductId(productId);

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

  const handleSkip = () => {
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
    onSkip();
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
              <Button size="sm" variant="ghost" onClick={handleSkip}>
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
              <Button size="sm" variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Matched state
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      {/* Ingredient Header */}
      <div className="mb-3">
        <p className="text-sm text-gray-500">
          {ingredient.name} • {ingredient.amount}
        </p>
      </div>

      {/* Best Match */}
      <div className="flex gap-4 mb-3">
        <div className="flex-shrink-0">
          <ImageWithFallback
            src={selectedProduct?.image || ''}
            alt={selectedProduct?.name || ''}
            className="w-20 h-20 object-cover rounded-xl"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium line-clamp-2">{selectedProduct?.name}</h3>
            {selectedProduct && getConfidenceBadge(selectedProduct.confidence, selectedProduct.confidenceLabel)}
          </div>
          <p className="text-red-500 font-medium mb-1">${selectedProduct?.price.toFixed(2)}</p>
          {selectedProduct?.reasoning && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{selectedProduct.reasoning}</p>
          )}

          {/* Feedback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleThumbsUp}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors",
                thumbsUpActive
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-300"
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {thumbsUpActive && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleThumbsDown}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors",
                thumbsDownActive
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-red-50 hover:border-red-300"
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {showFeedbackMessage && (
              <span className="text-sm text-green-600 animate-in fade-in">
                ✓ Thanks for the feedback!
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-end">
          <AddIngredientButton
            quantity={cartQuantity}
            onQuantityChange={(qty) => onQuantityChange(selectedProduct?.id || bestMatch.id, qty)}
          />
        </div>
      </div>

      {/* Show Alternatives Button */}
      {hasAlternatives && (
        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAlternatives ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide alternatives
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {alternatives.length} more {alternatives.length === 1 ? 'option' : 'options'}
              </>
            )}
          </button>

          {/* Alternatives List */}
          {showAlternatives && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
              {thumbsDownActive && (
                <p className="text-sm text-gray-600 mb-2">Try these alternatives or search manually:</p>
              )}

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
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-red-500 font-medium">${alt.price.toFixed(2)}</p>
                      {getConfidenceBadge(alt.confidence, alt.confidenceLabel)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alt.reasoning}</p>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

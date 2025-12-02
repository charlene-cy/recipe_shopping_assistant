import { useState, useEffect, useCallback } from 'react';
import { MatchedProduct } from '@/src/api/matchApi';

export interface MatchHistoryEntry {
  ingredientName: string; // Normalized name (lowercase, trimmed)
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  confidence: number;
  confidenceLabel: 'high' | 'medium' | 'low';
  reasoning: string;
  timestamp: string; // ISO string
  addedToCart: boolean;
  alternatives: Array<{
    productId: string;
    productName: string;
    confidence: number;
  }>;
}

const STORAGE_KEY = 'ingredient_match_history';

/**
 * Normalizes ingredient name for consistent matching
 * Removes recipe-specific context and standardizes format
 */
const normalizeIngredientName = (name: string): string => {
  return name.toLowerCase().trim();
};

export function useMatchHistory() {
  const [history, setHistory] = useState<Map<string, MatchHistoryEntry>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MatchHistoryEntry[];
        const historyMap = new Map<string, MatchHistoryEntry>();

        parsed.forEach((entry) => {
          const key = normalizeIngredientName(entry.ingredientName);
          historyMap.set(key, entry);
        });

        setHistory(historyMap);
        console.log('[MatchHistory] Loaded history:', historyMap.size, 'entries');
      }
    } catch (error) {
      console.error('[MatchHistory] Failed to load history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        const entries = Array.from(history.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        console.log('[MatchHistory] Saved history:', entries.length, 'entries');
      } catch (error) {
        console.error('[MatchHistory] Failed to save history:', error);
      }
    }
  }, [history, isLoaded]);

  /**
   * Get match history for a specific ingredient
   */
  const getMatch = useCallback((ingredientName: string): MatchHistoryEntry | null => {
    const key = normalizeIngredientName(ingredientName);
    const entry = history.get(key);

    if (entry) {
      console.log('[MatchHistory] Found match for:', ingredientName, entry);
    }

    return entry || null;
  }, [history]);

  /**
   * Save a new match to history
   */
  const saveMatch = useCallback((
    ingredientName: string,
    bestMatch: MatchedProduct,
    alternatives: MatchedProduct[] = []
  ) => {
    const key = normalizeIngredientName(ingredientName);

    const entry: MatchHistoryEntry = {
      ingredientName: key,
      productId: bestMatch.id,
      productName: bestMatch.name,
      productPrice: bestMatch.price,
      productImage: bestMatch.image,
      confidence: bestMatch.confidence,
      confidenceLabel: bestMatch.confidenceLabel,
      reasoning: bestMatch.reasoning,
      timestamp: new Date().toISOString(),
      addedToCart: false,
      alternatives: alternatives.slice(0, 5).map(alt => ({
        productId: alt.id,
        productName: alt.name,
        confidence: alt.confidence,
      })),
    };

    setHistory(prev => {
      const updated = new Map(prev);
      updated.set(key, entry);
      return updated;
    });

    console.log('[MatchHistory] Saved match:', ingredientName, '→', bestMatch.name);
  }, []);

  /**
   * Mark a match as added to cart
   */
  const markAsAddedToCart = useCallback((ingredientName: string, productId: string) => {
    const key = normalizeIngredientName(ingredientName);
    const existing = history.get(key);

    if (existing && existing.productId === productId) {
      const updated: MatchHistoryEntry = {
        ...existing,
        addedToCart: true,
      };

      setHistory(prev => {
        const newMap = new Map(prev);
        newMap.set(key, updated);
        return newMap;
      });

      console.log('[MatchHistory] Marked as added to cart:', ingredientName);
    }
  }, [history]);

  /**
   * Update match with a different product (when user selects alternative)
   */
  const updateMatch = useCallback((
    ingredientName: string,
    newProduct: MatchedProduct
  ) => {
    const key = normalizeIngredientName(ingredientName);
    const existing = history.get(key);

    if (existing) {
      const updated: MatchHistoryEntry = {
        ...existing,
        productId: newProduct.id,
        productName: newProduct.name,
        productPrice: newProduct.price,
        productImage: newProduct.image,
        confidence: newProduct.confidence,
        confidenceLabel: newProduct.confidenceLabel,
        reasoning: newProduct.reasoning,
        timestamp: new Date().toISOString(),
        addedToCart: false, // Reset when switching products
      };

      setHistory(prev => {
        const newMap = new Map(prev);
        newMap.set(key, updated);
        return newMap;
      });

      console.log('[MatchHistory] Updated match:', ingredientName, '→', newProduct.name);
    }
  }, [history]);

  /**
   * Clear a specific match from history (for rematch)
   */
  const clearMatch = useCallback((ingredientName: string) => {
    const key = normalizeIngredientName(ingredientName);

    setHistory(prev => {
      const updated = new Map(prev);
      updated.delete(key);
      return updated;
    });

    console.log('[MatchHistory] Cleared match:', ingredientName);
  }, []);

  /**
   * Clear all history
   */
  const clearAllHistory = useCallback(() => {
    setHistory(new Map());
    localStorage.removeItem(STORAGE_KEY);
    console.log('[MatchHistory] Cleared all history');
  }, []);

  return {
    isLoaded,
    getMatch,
    saveMatch,
    markAsAddedToCart,
    updateMatch,
    clearMatch,
    clearAllHistory,
  };
}

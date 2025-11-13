'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { RecipeDetailPage } from '@/src/components/RecipeDetailPage';
import { Recipe, WeeeProduct, CartItem } from '@/src/types';
import { useCart } from '@/app/hooks/useCart';
import { useProducts } from '@/app/hooks/useProducts';
import { useRecipes } from '@/app/hooks/useRecipes';

export default function RecipeDetailPageRoute() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;

  const { cartItems, addToCart, updateQuantity } = useCart();
  const { products: weeeProducts, loading: productsLoading, error: productsError } = useProducts();
  const { recipes, loading: recipesLoading, error: recipesError } = useRecipes();

  const recipe = useMemo(() => recipes.find(r => r.id === recipeId), [recipes, recipeId]);

  const getProductsForRecipe = (recipe: Recipe): WeeeProduct[] => {
    // TODO: Integrate /api/match to return only the matched products per ingredient
    return weeeProducts;
  };

  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach(item => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cartItems]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity === 0) {
      updateQuantity(productId, 0);
      return;
    }

    const product = weeeProducts.find(p => p.id === productId);
    if (!product || !recipe) return;

    const existingItem = cartItems.find(item => item.product.id === productId);

    if (!existingItem) {
      const newItem: CartItem = {
        product,
        quantity,
        recipeId: recipe.id,
        recipeName: recipe.name,
      };
      addToCart([newItem]);
    } else {
      updateQuantity(productId, quantity);
    }
  };

  const handleAddToCart = (products: WeeeProduct[], selectedRecipeId: string, recipeName: string) => {
    const newItems: CartItem[] = products.map(product => ({
      product,
      quantity: 1,
      recipeId: selectedRecipeId,
      recipeName,
    }));

    addToCart(newItems);
  };

  if (recipesLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading recipe...</p>
      </div>
    );
  }

  if (recipesError || productsError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-2">
          <p className="text-gray-700 font-medium">Unable to load recipe details.</p>
          {recipesError && <p className="text-sm text-gray-500">{recipesError}</p>}
          {productsError && <p className="text-sm text-gray-500">{productsError}</p>}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Recipe not found</p>
      </div>
    );
  }

  return (
    <RecipeDetailPage
      recipe={recipe}
      products={getProductsForRecipe(recipe)}
      onBack={() => router.push('/')}
      cartQuantities={cartQuantities}
      onQuantityChange={handleQuantityChange}
      onAddToCart={(products) => handleAddToCart(products, recipe.id, recipe.name)}
    />
  );
}

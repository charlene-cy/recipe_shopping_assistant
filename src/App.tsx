import { useState, useEffect } from 'react';
import { RecipeSwipePage } from './components/RecipeSwipePage';
import { RecipeDetailPage } from './components/RecipeDetailPage';
import { CartPage } from './components/CartPage';
import { mockRecipes, mockWeeeProducts } from './data/mockData';
import { Recipe, WeeeProduct, CartItem } from './types';
import { Button } from './components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Toaster, toast } from './components/ui/sonner';

type Screen = 'swipe' | 'detail' | 'cart';

// App version/build timestamp - updates on every code change
const APP_VERSION = Date.now().toString();
const VERSION_KEY = 'app_version';
const CART_KEY = 'cart_items';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('swipe');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Clear cart on app update/code change (development)
  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;

    if (isDevelopment) {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const currentVersion = APP_VERSION;

      // If version changed (code update/HMR), clear cart
      if (storedVersion && storedVersion !== currentVersion) {
        console.log('🔄 App updated - clearing cart and cached data');

        // Clear cart
        setCartItems([]);
        localStorage.removeItem(CART_KEY);

        // Clear any other cached data
        localStorage.removeItem('match_results_cache');
        localStorage.removeItem('user_feedback_cache');

        // Optional: Show toast notification
        setTimeout(() => {
          toast.info('Cart refreshed due to app update');
        }, 500);
      }

      // Update version
      localStorage.setItem(VERSION_KEY, currentVersion);
    }

    // Also clear on page refresh in development
    const handleBeforeUnload = () => {
      if (isDevelopment) {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem('match_results_cache');
        localStorage.removeItem('user_feedback_cache');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // HMR detection - clear cart when module is hot-updated
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        console.log('🔥 HMR update detected - clearing cart');
        setCartItems([]);
        localStorage.removeItem(CART_KEY);
      });
    }
  }, []);

  // Create a map of product quantities from cart items
  const cartQuantities = new Map<string, number>();
  cartItems.forEach(item => {
    cartQuantities.set(item.product.id, item.quantity);
  });

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentScreen('detail');
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity === 0) {
        // Remove item from cart
        return prevItems.filter(item => item.product.id !== productId);
      }

      const existingIndex = prevItems.findIndex(item => item.product.id === productId);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity = quantity;
        return updatedItems;
      } else {
        // Add new item - find the product and use current recipe context
        const product = mockWeeeProducts.find(p => p.id === productId);
        if (!product || !selectedRecipe) return prevItems;
        
        return [...prevItems, {
          product,
          quantity,
          recipeId: selectedRecipe.id,
          recipeName: selectedRecipe.name
        }];
      }
    });
  };

  const handleAddToCart = (products: WeeeProduct[], recipeId: string, recipeName: string) => {
    const newItems: CartItem[] = products.map(product => ({
      product,
      quantity: 1,
      recipeId,
      recipeName,
    }));

    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      
      newItems.forEach(newItem => {
        const existingIndex = updatedItems.findIndex(
          item => item.product.id === newItem.product.id
        );
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += 1;
        } else {
          updatedItems.push(newItem);
        }
      });
      
      return updatedItems;
    });
  };

  const handleAddIndividualToCart = (product: WeeeProduct, recipeId: string, recipeName: string) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        item => item.product.id === product.id
      );
      
      if (existingIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity += 1;
        return updatedItems;
      } else {
        return [...prevItems, { product, quantity: 1, recipeId, recipeName }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const getProductsForRecipe = (recipe: Recipe): WeeeProduct[] => {
    return mockWeeeProducts.filter(product =>
      recipe.ingredients.some(ingredient => ingredient.id === product.ingredientId)
    );
  };

  return (
    <div className="relative">
      <Toaster />
      
      {/* Floating Cart Button */}
      {currentScreen !== 'cart' && (
        <Button
          size="icon"
          className="fixed top-6 right-6 z-50 rounded-full shadow-lg bg-white hover:bg-gray-50 border border-gray-200"
          onClick={() => setCurrentScreen('cart')}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartItems.length}
              </span>
            )}
          </div>
        </Button>
      )}

      {/* Screens */}
      {currentScreen === 'swipe' && (
        <RecipeSwipePage
          recipes={mockRecipes}
          onRecipeSelect={handleRecipeSelect}
        />
      )}

      {currentScreen === 'detail' && selectedRecipe && (
        <RecipeDetailPage
          recipe={selectedRecipe}
          products={getProductsForRecipe(selectedRecipe)}
          onBack={() => setCurrentScreen('swipe')}
          cartQuantities={cartQuantities}
          onQuantityChange={handleQuantityChange}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentScreen === 'cart' && (
        <CartPage
          cartItems={cartItems}
          onBack={() => setCurrentScreen('swipe')}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
        />
      )}
    </div>
  );
}
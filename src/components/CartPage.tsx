import { useState } from 'react';
import { CartItem } from '@/src/types';
import { Button } from './ui/button';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AddIngredientButton } from './AddIngredientButton';
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
import { toast } from 'sonner';

interface CartPageProps {
  cartItems: CartItem[];
  onBack: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function CartPage({ cartItems, onBack, onUpdateQuantity, onRemoveItem, onClearCart }: CartPageProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleClearCart = () => {
    onClearCart();
    setShowClearDialog(false);
    toast.success('Cart cleared');
  };

  // Group items by recipe
  const itemsByRecipe = cartItems.reduce((acc, item) => {
    if (!acc[item.recipeId]) {
      acc[item.recipeId] = {
        recipeName: item.recipeName,
        items: [],
      };
    }
    acc[item.recipeId].items.push(item);
    return acc;
  }, {} as Record<string, { recipeName: string; items: CartItem[] }>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4 md:p-6 lg:p-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl lg:text-2xl">Shopping Cart</h1>
            <p className="text-gray-500 text-sm md:text-base lg:text-lg">{cartItems.length} items</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-32">
        {Object.entries(itemsByRecipe).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4 text-sm md:text-base lg:text-lg">Your cart is empty</p>
            <Button onClick={onBack} className="min-h-[44px]">Browse Recipes</Button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {Object.entries(itemsByRecipe).map(([recipeId, { recipeName, items }]) => (
              <div key={recipeId} className="bg-white rounded-2xl p-3 md:p-4 lg:p-5">
                <h3 className="mb-3 md:mb-4 text-orange-600 text-base md:text-lg lg:text-xl">{recipeName}</h3>
                <div className="space-y-3 md:space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex flex-col md:flex-row gap-3 md:gap-4 pb-3 md:pb-4 border-b last:border-0">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full md:w-20 h-48 md:h-20 object-cover rounded-xl flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 line-clamp-2 text-sm md:text-base lg:text-lg">{item.product.name}</h4>
                        <p className="text-orange-600 mb-2 text-sm md:text-base lg:text-lg">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex-shrink-0 flex items-end">
                        <AddIngredientButton
                          quantity={item.quantity}
                          onQuantityChange={(newQuantity) => {
                            if (newQuantity === 0) {
                              onRemoveItem(item.product.id);
                            } else {
                              onUpdateQuantity(item.product.id, newQuantity);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Checkout */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:p-6 lg:p-8">
          <div className="mb-3 md:mb-4 flex justify-between items-center">
            <span className="text-sm md:text-base lg:text-lg">Total</span>
            <span className="text-orange-600 text-base md:text-lg lg:text-xl font-semibold">${totalPrice.toFixed(2)}</span>
          </div>
          <Button
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600 min-h-[44px] text-sm md:text-base lg:text-lg mb-2"
            onClick={() => window.open('https://www.sayweee.com', '_blank')}
          >
            Checkout on Weee!
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          {/* Clear Cart Button */}
          <button
            onClick={() => setShowClearDialog(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 py-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Items
          </button>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
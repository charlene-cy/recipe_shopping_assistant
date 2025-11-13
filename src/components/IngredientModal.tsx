import { useState } from 'react';
import { Recipe, WeeeProduct } from '@/src/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';
import { AddIngredientButton } from './AddIngredientButton';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  products: WeeeProduct[];
  cartQuantities: Map<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (products: WeeeProduct[]) => void;
}

export function IngredientModal({ isOpen, onClose, recipe, products, cartQuantities, onQuantityChange, onAddToCart }: IngredientModalProps) {

  const handleAddAllToCart = () => {
    onAddToCart(products);
    toast.success(`Added ${products.length} items to cart`);
  };

  // Group products by ingredient
  const productsByIngredient = recipe.ingredients.map(ingredient => ({
    ingredient,
    product: products.find(p => p.ingredientId === ingredient.id),
  }));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Weee! Product Matches</SheetTitle>
            <p className="text-gray-500">Review AI-matched ingredients for {recipe.name}</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {productsByIngredient.map(({ ingredient, product }) => {
              if (!product) return null;
              
              const isAdded = (cartQuantities.get(product.id) ?? 0) > 0;

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 mb-1">
                        {ingredient.name} • {ingredient.amount}
                      </p>
                      <h3 className="mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-red-500">${product.price.toFixed(2)}</p>
                    </div>

                    <div className="flex-shrink-0 flex items-end">
                      <AddIngredientButton
                        quantity={cartQuantities.get(product.id) || 0}
                        onQuantityChange={(newQuantity) => onQuantityChange(product.id, newQuantity)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 pt-4 border-t bg-white">
            <div className="mb-3 flex justify-between items-center">
              <span className="text-gray-600">
                {products.length} items
              </span>
              <span className="text-red-500">
                Total: ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={handleAddAllToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add All to Cart
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
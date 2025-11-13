import { Recipe, WeeeProduct } from '@/src/types';
import { Star, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { IngredientModal } from './IngredientModal';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RecipeDetailPageProps {
  recipe: Recipe;
  products: WeeeProduct[];
  onBack: () => void;
  cartQuantities: Map<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
  onAddToCart: (products: WeeeProduct[], recipeId: string, recipeName: string) => void;
}

export function RecipeDetailPage({ recipe, products, onBack, cartQuantities, onQuantityChange, onAddToCart }: RecipeDetailPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="relative h-48 md:h-64 lg:h-80">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full min-w-[44px] min-h-[44px]"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
          <h1 className="text-white mb-2 text-2xl md:text-3xl lg:text-4xl">{recipe.name}</h1>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < recipe.difficulty
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-4 text-white/90">
            <span>⏱️ {recipe.cookTime}</span>
            <span>🍽️ {recipe.servings} servings</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 md:p-6 md:pb-32 lg:p-8 lg:pb-40">
        {/* Ingredients Section */}
        <section className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="mb-3 md:mb-4 lg:mb-5 text-xl md:text-2xl lg:text-3xl">Ingredients</h2>
          <div className="bg-gray-50 rounded-2xl p-3 md:p-4 lg:p-5 space-y-2 md:space-y-3">
            {recipe.ingredients.map((ingredient) => {
              const hasMatch = products.some(p => p.ingredientId === ingredient.id);
              
              return (
                <div key={ingredient.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{ingredient.name}</span>
                    <span className="text-gray-500">{ingredient.amount}</span>
                  </div>
                  {hasMatch && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                      Weee!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Directions Section */}
        <section>
          <h2 className="mb-3 md:mb-4 lg:mb-5 text-xl md:text-2xl lg:text-3xl">Directions</h2>
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {recipe.directions.map((direction, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="text-gray-700 flex-1 pt-1">{direction}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 bg-gradient-to-t from-white via-white to-transparent">
        <Button
          size="lg"
          className="w-full bg-orange-500 hover:bg-orange-600 min-h-[44px] text-base md:text-lg"
          onClick={() => setIsModalOpen(true)}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add Ingredients to Cart
        </Button>
      </div>

      {/* Ingredient Modal */}
      <IngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={recipe}
        products={products}
        cartQuantities={cartQuantities}
        onQuantityChange={onQuantityChange}
        onAddToCart={(selectedProducts) => {
          onAddToCart(selectedProducts, recipe.id, recipe.name);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
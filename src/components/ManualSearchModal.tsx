import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WeeeProduct, RecipeIngredient } from '@/src/types';

interface ManualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: RecipeIngredient;
  products: WeeeProduct[];
  onSelect: (product: WeeeProduct) => void;
}

export function ManualSearchModal({
  isOpen,
  onClose,
  ingredient,
  products,
  onSelect,
}: ManualSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(ingredient.name);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const name = product.name.toLowerCase();
      return name.includes(query);
    });
  }, [searchQuery, products]);

  const handleSelect = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      onSelect(product);
      onClose();
    }
  };

  const handleCancel = () => {
    setSearchQuery(ingredient.name);
    setSelectedProductId(null);
    onClose();
  };

  // Handle sheet state changes - prevent closing parent modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <div>
              <SheetTitle>Search Products Manually</SheetTitle>
              <p className="text-sm text-gray-500 mt-1">
                Finding: {ingredient.name} • {ingredient.amount}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                autoFocus
              />
            </div>
          </SheetHeader>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">No products found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
                {filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="manual-search-product"
                      checked={selectedProductId === product.id}
                      onChange={() => setSelectedProductId(product.id)}
                      className="mt-1"
                    />
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-2">{product.name}</p>
                      <p className="text-red-500 font-medium mt-1">${product.price.toFixed(2)}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-6 pt-4 border-t bg-white">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={handleSelect}
                disabled={!selectedProductId}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Select Product
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

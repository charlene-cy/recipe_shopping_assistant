'use client';

import { Button } from '@/src/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CartItem } from '@/src/types';

export function CartButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const storedCart = localStorage.getItem('cartItems');
      if (storedCart) {
        try {
          const cartItems: CartItem[] = JSON.parse(storedCart);
          setCartItemCount(cartItems.length);
        } catch (error) {
          console.error('Failed to load cart count', error);
        }
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    
    // Listen for storage changes (from other tabs/windows)
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for same-tab updates
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // Don't show cart button on cart page
  if (pathname === '/cart') {
    return null;
  }

  return (
    <Button
      size="icon"
      className="fixed top-6 right-6 z-50 rounded-full shadow-lg bg-white hover:bg-gray-50 border border-gray-200"
      onClick={() => router.push('/cart')}
    >
      <div className="relative">
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {cartItemCount}
          </span>
        )}
      </div>
    </Button>
  );
}









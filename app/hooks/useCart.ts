'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/src/types';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      if (cartItems.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
      } else {
        localStorage.removeItem('cartItems');
      }
      
      // Dispatch custom event for CartButton to update
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, [cartItems, isLoading]);

  const addToCart = useCallback((items: CartItem[]) => {
    setCartItems(prevItems => {
      const updatedItems = [...prevItems];
      
      items.forEach(newItem => {
        const existingIndex = updatedItems.findIndex(
          item => item.product.id === newItem.product.id
        );
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });
      
      return updatedItems;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity === 0) {
        return prevItems.filter(item => item.product.id !== productId);
      }
      
      return prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
}












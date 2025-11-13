'use client';

import { CartPage } from '@/src/components/CartPage';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/hooks/useCart';

export default function CartPageRoute() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeItem } = useCart();

  return (
    <CartPage
      cartItems={cartItems}
      onBack={() => router.push('/')}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
    />
  );
}


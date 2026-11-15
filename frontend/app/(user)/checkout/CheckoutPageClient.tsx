'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutForm } from './CheckoutForm';
import { useCart } from '../../providers/CartProvider';

export function CheckoutPageClient() {
  const { cart, isLoading } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !cart?.items.length) router.replace('/cart');
  }, [cart, isLoading, router]);

  if (isLoading) {
    return (
      <div className="cart-loading-skeleton">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row short" />
      </div>
    );
  }

  if (!cart) return null;

  return <CheckoutForm cart={cart} />;
}

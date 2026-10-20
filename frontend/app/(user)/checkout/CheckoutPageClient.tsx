'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutForm } from './CheckoutForm';
import { useCart } from '../../providers/CartProvider';

export function CheckoutPageClient() {
  const { cart, isLoading, error } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (error || !cart?.items?.length)) router.replace('/cart');
  }, [cart, error, isLoading, router]);

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

'use client';

import Link from 'next/link';
import { CartItems } from './CartItems';
import { useCart } from '../../providers/CartProvider';

export function CartPageClient() {
  const { cart, isLoading, error } = useCart();

  if (isLoading) {
    return (
      <div className="cart-loading-skeleton">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row short" />
      </div>
    );
  }

  if (error) return <p role="alert" className="cart-error">{error}</p>;

  if (!cart?.items?.length) {
    return (
      <div className="cart-empty">
        <p>Your cart is waiting for something lovely.</p>
        <Link className="button button-outline" href="/products">
          Browse products <span aria-hidden="true">↗</span>
        </Link>
      </div>
    );
  }

  return <CartItems />;
}

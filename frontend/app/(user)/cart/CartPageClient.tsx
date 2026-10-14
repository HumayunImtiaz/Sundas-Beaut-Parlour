'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CartItems } from './CartItems';

type CartData = {
  items?: { id: string; quantity: number }[];
  subtotal?: number;
};

export function CartPageClient() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json() as { cart?: CartData | null };
        setCart(data.cart ?? null);
      } catch {
        setCart(null);
      } finally {
        setLoading(false);
      }
    }
    void loadCart();
  }, []);

  if (loading) {
    return (
      <div className="cart-loading-skeleton">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row short" />
      </div>
    );
  }

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

  return <CartItems cart={cart} />;
}

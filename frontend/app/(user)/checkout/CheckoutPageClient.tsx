'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutForm } from './CheckoutForm';

// Use a permissive type here — CheckoutForm accepts `{ cart: Cart }` but
// Cart is defined inside CheckoutForm. We fetch the raw cart object from
// the API and pass it through; CheckoutForm casts internally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawCart = Record<string, any>;

export function CheckoutPageClient() {
  const [cart, setCart] = useState<RawCart | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) { router.replace('/cart'); return; }
        const data = await res.json() as { cart?: RawCart | null };
        const items = data.cart?.items as { id: string }[] | undefined;
        if (!items?.length) {
          router.replace('/cart');
          return;
        }
        setCart(data.cart!);
      } catch {
        router.replace('/cart');
      } finally {
        setLoading(false);
      }
    }
    void loadCart();
  }, [router]);

  if (loading) {
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

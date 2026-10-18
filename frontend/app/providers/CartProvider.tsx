'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { usePathname } from 'next/navigation';
import { CART_UPDATED_EVENT, type CartUpdatedDetail } from '@/lib/cart-events';

export type CartProductData = {
  thumbnail?: string | null;
  title?: string;
};

export type CartItemData = {
  id: string;
  title?: string;
  product_title?: string;
  variant_title?: string;
  thumbnail?: string | null;
  variant?: { product?: CartProductData };
  product?: CartProductData;
  variant_id?: string;
  quantity: number;
  unit_price?: number;
};

export type CartData = {
  id?: string;
  items?: CartItemData[];
  subtotal?: number;
};

type CartContextValue = {
  cart: CartData | null;
  cartItemCount: number;
  isLoading: boolean;
  error: string | null;
  setCart: Dispatch<SetStateAction<CartData | null>>;
};

const CART_COUNT_CACHE_KEY = 'sundas_cart_count';
const CartContext = createContext<CartContextValue | null>(null);

function readCachedCartCount(): number {
  try {
    const cached = localStorage.getItem(CART_COUNT_CACHE_KEY);
    return cached ? Math.max(0, parseInt(cached, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

function cacheCartCount(count: number) {
  try {
    localStorage.setItem(CART_COUNT_CACHE_KEY, String(count));
  } catch {
    // The cart remains usable when localStorage is unavailable.
  }
}

function getItemCount(cart: CartData | null): number {
  return cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [cart, setCartState] = useState<CartData | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const previousPathname = useRef(pathname);
  const inFlightRequest = useRef<Promise<void> | null>(null);
  const cartRevision = useRef(0);

  const refreshCart = useCallback(async () => {
    if (inFlightRequest.current) return inFlightRequest.current;
    const revisionAtRequest = cartRevision.current;
    setIsLoading(true);
    setError(null);
    const request = (async () => {
      try {
        const response = await fetch('/api/cart', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load your cart.');
        const data = await response.json() as { cart?: CartData | null };
        if (cartRevision.current === revisionAtRequest) setCartState(data.cart ?? null);
      } catch (requestError) {
        if (cartRevision.current === revisionAtRequest) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load your cart.');
        }
      } finally {
        setIsLoading(false);
        inFlightRequest.current = null;
      }
    })();
    inFlightRequest.current = request;
    return request;
  }, []);

  const setCart = useCallback<Dispatch<SetStateAction<CartData | null>>>((nextCart) => {
    cartRevision.current += 1;
    setError(null);
    setCartState(nextCart);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const cachedCount = readCachedCartCount();
      setCartItemCount(cachedCount);
      void refreshCart();
    } else if (pathname === '/cart' && previousPathname.current !== '/cart') {
      void refreshCart();
    }
    previousPathname.current = pathname;
  }, [pathname, refreshCart]);

  useEffect(() => {
    function handleCartUpdated(event: Event) {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail;
      if (typeof detail?.itemCount === 'number') {
        setCartItemCount(detail.itemCount);
        cacheCartCount(detail.itemCount);
      } else if (typeof detail?.delta === 'number') {
        setCartItemCount((current) => {
          const next = Math.max(0, current + detail.delta!);
          cacheCartCount(next);
          return next;
        });
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, []);

  useEffect(() => {
    if (isLoading || error) return;
    const count = getItemCount(cart);
    setCartItemCount(count);
    cacheCartCount(count);
  }, [cart, error, isLoading]);

  return (
    <CartContext.Provider value={{ cart, cartItemCount, isLoading, error, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider.');
  return value;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useToast } from './ToastProvider';

export type CartItemData = {
  id: string;
  title?: string;
  product_title?: string;
  product_slug?: string;
  thumbnail?: string | null;
  quantity: number;
  unit_price?: number;
};

export type CartData = {
  items: CartItemData[];
  subtotal: number;
};

type CartContextValue = {
  cart: CartData | null;
  cartItemCount: number;
  isLoading: boolean;
  setCart: Dispatch<SetStateAction<CartData | null>>;
};

const CART_STORAGE_KEY = 'sundas_cart';
const CartContext = createContext<CartContextValue | null>(null);

function isCart(value: unknown): value is CartData {
  if (!value || typeof value !== 'object') return false;
  const cart = value as Partial<CartData>;
  return typeof cart.subtotal === 'number' &&
    Number.isFinite(cart.subtotal) &&
    Array.isArray(cart.items) && cart.items.every((item) =>
    Boolean(
      item &&
      typeof item.id === 'string' &&
      typeof item.quantity === 'number' &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0 &&
      typeof item.unit_price === 'number' &&
      Number.isFinite(item.unit_price)
    )
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [cart, setCartState] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cartItemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);
        if (isCart(parsed)) setCartState(parsed);
        else {
          localStorage.removeItem(CART_STORAGE_KEY);
          showToast('Saved cart data was invalid and has been cleared.', 'warning');
        }
      }
    } catch (error) {
      console.warn('[cart] Could not restore the saved cart from this browser.', error);
      showToast('Your saved cart could not be restored. You can continue with an empty cart.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isLoading) return;
    try {
      if (cart?.items.length) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      else localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.warn('[cart] Could not save the cart in this browser.', error);
      showToast('Your cart could not be saved in this browser. Changes may be lost when you close the page.', 'warning');
    }
  }, [cart, isLoading, showToast]);

  const setCart = useCallback<Dispatch<SetStateAction<CartData | null>>>((nextCart) => {
    setCartState(nextCart);
  }, []);

  return (
    <CartContext.Provider value={{ cart, cartItemCount, isLoading, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used within CartProvider.');
  return value;
}

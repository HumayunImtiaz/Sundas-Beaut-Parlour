'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { notifyCartUpdated } from '@/lib/cart-events';

type CartProduct = {
  thumbnail?: string | null;
  title?: string;
};

type CartItem = {
  id: string;
  title?: string;
  product_title?: string;
  variant_title?: string;
  variant?: { product?: CartProduct };
  product?: CartProduct;
  variant_id: string;
  quantity: number;
  unit_price?: number;
};

type Cart = {
  items?: CartItem[];
  subtotal?: number;
};

export function CartItems({ cart: initialCart }: { cart: unknown }) {
  const [cart, setCart] = useState(initialCart as Cart);
  const [busyItems, setBusyItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const busyItemsRef = useRef(new Set<string>());
  const updateVersionsRef = useRef(new Map<string, number>());

  function setItemBusy(lineItemId: string, busy: boolean) {
    if (busy) busyItemsRef.current.add(lineItemId);
    else busyItemsRef.current.delete(lineItemId);
    setBusyItems(new Set(busyItemsRef.current));
  }

  async function updateItem(lineItemId: string, quantity: number) {
    if (busyItemsRef.current.has(lineItemId)) return;
    const previousCart = cart;
    const previousCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
    const previousItem = cart.items?.find((item) => item.id === lineItemId);
    const updateVersion = (updateVersionsRef.current.get(lineItemId) ?? 0) + 1;
    updateVersionsRef.current.set(lineItemId, updateVersion);
    setItemBusy(lineItemId, true);
    setError('');
    setCart((currentCart) => ({
      ...currentCart,
      items: currentCart.items?.map((item) => item.id === lineItemId ? { ...item, quantity } : item)
    }));
    const optimisticCount = previousCount + quantity - (previousItem?.quantity ?? quantity);
    notifyCartUpdated({ itemCount: optimisticCount });
    window.setTimeout(() => setItemBusy(lineItemId, false), 400);
    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_item_id: lineItemId, quantity })
      });
      if (!response.ok) throw new Error('Unable to update your cart. Please try again.');
      const serverCart = (await response.json()).cart as Cart;
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) {
        setCart((currentCart) => ({
          ...currentCart,
          subtotal: serverCart.subtotal,
          items: currentCart.items?.map((item) => {
            const serverItem = serverCart.items?.find((candidate) => candidate.id === item.id);
            return serverItem ? { ...item, ...serverItem } : item;
          })
        }));
        notifyCartUpdated({ itemCount: serverCart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0 });
      }
    } catch (requestError) {
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) {
        setCart(previousCart);
        notifyCartUpdated({ itemCount: previousCount });
        setError(requestError instanceof Error ? requestError.message : 'Unable to update your cart. Please try again.');
      }
    } finally {
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) updateVersionsRef.current.delete(lineItemId);
    }
  }

  async function removeItem(lineItemId: string) {
    if (busyItemsRef.current.has(lineItemId)) return;
    const previousCart = cart;
    const removedItem = cart.items?.find((item) => item.id === lineItemId);
    const previousCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
    const updateVersion = (updateVersionsRef.current.get(lineItemId) ?? 0) + 1;
    updateVersionsRef.current.set(lineItemId, updateVersion);
    setItemBusy(lineItemId, true);
    setError('');
    setCart((currentCart) => ({
      ...currentCart,
      items: currentCart.items?.filter((item) => item.id !== lineItemId)
    }));
    notifyCartUpdated({ itemCount: Math.max(0, previousCount - (removedItem?.quantity ?? 0)) });
    window.setTimeout(() => setItemBusy(lineItemId, false), 400);
    try {
      const response = await fetch(`/api/cart?line_item_id=${encodeURIComponent(lineItemId)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to remove this item. Please try again.');
      const serverCart = (await response.json()).cart as Cart;
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) {
        setCart((currentCart) => ({
          ...currentCart,
          subtotal: serverCart.subtotal,
          items: serverCart.items ? currentCart.items?.filter((item) => serverCart.items?.some((serverItem) => serverItem.id === item.id)) : currentCart.items
        }));
        notifyCartUpdated({ itemCount: serverCart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0 });
      }
    } catch (requestError) {
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) {
        setCart(previousCart);
        notifyCartUpdated({ itemCount: previousCount });
        setError(requestError instanceof Error ? requestError.message : 'Unable to remove this item. Please try again.');
      }
    } finally {
      if (updateVersionsRef.current.get(lineItemId) === updateVersion) updateVersionsRef.current.delete(lineItemId);
    }
  }

  return <div className="cart-layout">
    <div className="cart-items">{error && <p role="alert" className="cart-error">{error}</p>}{cart.items?.map((item) => <article className="cart-item" key={item.id}>
      <div className="cart-item-product">{(item.variant?.product?.thumbnail ?? item.product?.thumbnail) && <div className="cart-item-image"><Image src={(item.variant?.product?.thumbnail ?? item.product?.thumbnail) as string} alt={item.product_title ?? item.title ?? 'Product'} fill unoptimized sizes="96px" /></div>}<div><p className="eyebrow">{item.variant_title ?? 'Product'}</p><h2>{item.product_title ?? item.title}</h2><p className="cart-item-variant">Variant ID: {item.variant_id}</p></div></div>
      <div className="cart-item-actions"><strong>PKR {(item.unit_price ?? 0).toLocaleString()}</strong><div className="cart-quantity"><button type="button" disabled={busyItems.has(item.id)} onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} aria-label={`Decrease ${item.product_title ?? item.title}`}>−</button><span>{item.quantity}</span><button type="button" disabled={busyItems.has(item.id)} onClick={() => updateItem(item.id, item.quantity + 1)} aria-label={`Increase ${item.product_title ?? item.title}`}>+</button></div><button className="cart-remove" type="button" disabled={busyItems.has(item.id)} onClick={() => removeItem(item.id)}>Remove</button></div>
    </article>)}</div>
    <aside className="cart-summary"><p className="eyebrow">Summary</p><div><span>Subtotal</span><strong>PKR {(cart.subtotal ?? 0).toLocaleString()}</strong></div><button className="button button-gold bg-gradient-gold" type="button">Proceed to Checkout <span aria-hidden="true">↗</span></button></aside>
  </div>;
}
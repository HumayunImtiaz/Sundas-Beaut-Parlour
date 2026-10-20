'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { notifyCartUpdated } from '@/lib/cart-events';
import { queueCartQuantityUpdate } from '@/lib/cart-sync';
import { useCart, type CartData } from '../../providers/CartProvider';

export function CartItems() {
  const { cart: sharedCart, setCart } = useCart();
  if (!sharedCart) return null;
  const cart = sharedCart;
  const [pendingItems, setPendingItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const baseQuantitiesRef = useRef(new Map<string, number>());

  async function updateItem(lineItemId: string, quantity: number) {
    const previousCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
    const previousItem = cart.items?.find((item) => item.id === lineItemId);
    if (!previousItem) return;
    if (!baseQuantitiesRef.current.has(lineItemId)) {
      baseQuantitiesRef.current.set(lineItemId, previousItem.quantity);
    }
    setPendingItems((current) => new Set(current).add(lineItemId));
    setError('');
    setCart((currentCart) => {
      const current: CartData = currentCart ?? { items: [] };
      return {
        ...current,
        items: current.items?.map((item) => item.id === lineItemId ? { ...item, quantity } : item)
      };
    });
    const optimisticCount = previousCount + quantity - (previousItem?.quantity ?? quantity);
    notifyCartUpdated({ itemCount: optimisticCount });
    try {
      await queueCartQuantityUpdate<CartData>(lineItemId, quantity, {
        onSuccess: (serverCart) => {
          baseQuantitiesRef.current.delete(lineItemId);
          const serverItem = serverCart.items?.find((item) => item.id === lineItemId);
        setCart((currentCart) => {
          const current: CartData = currentCart ?? { items: [] };
          return {
            ...current,
            subtotal: serverCart.subtotal,
            items: current.items?.map((item) => item.id === lineItemId && serverItem
              ? { ...item, ...serverItem }
              : item)
          };
        });
        notifyCartUpdated({ itemCount: serverCart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0 });
        },
        onError: (requestError) => {
          const baseQuantity = baseQuantitiesRef.current.get(lineItemId) ?? previousItem.quantity;
          baseQuantitiesRef.current.delete(lineItemId);
          setCart((currentCart) => {
            const current: CartData = currentCart ?? { items: [] };
            return {
              ...current,
              items: current.items?.map((item) => item.id === lineItemId
                ? { ...item, quantity: baseQuantity }
                : item)
            };
          });
          setError(requestError.message);
        },
      });
    } catch (requestError) {
      if (!(requestError instanceof Error)) setError('Unable to update your cart. Please try again.');
    } finally {
      setPendingItems((current) => {
        const next = new Set(current);
        next.delete(lineItemId);
        return next;
      });
    }
  }

  async function removeItem(lineItemId: string) {
    if (pendingItems.has(lineItemId)) return;
    const previousCart = cart;
    const removedItem = cart.items?.find((item) => item.id === lineItemId);
    const previousCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
    setError('');
    setCart((currentCart) => {
      const current: CartData = currentCart ?? { items: [] };
      return {
        ...current,
        items: current.items?.filter((item) => item.id !== lineItemId)
      };
    });
    notifyCartUpdated({ itemCount: Math.max(0, previousCount - (removedItem?.quantity ?? 0)) });
    try {
      const response = await fetch(`/api/cart?line_item_id=${encodeURIComponent(lineItemId)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to remove this item. Please try again.');
      const serverCart = (await response.json()).cart as CartData;
      setCart((currentCart) => {
          const current: CartData = currentCart ?? { items: [] };
          return {
            ...current,
            subtotal: serverCart.subtotal,
            items: serverCart.items ? current.items?.filter((item) => serverCart.items?.some((serverItem) => serverItem.id === item.id)) : current.items
          };
      });
      notifyCartUpdated({ itemCount: serverCart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0 });
    } catch (requestError) {
      setCart(previousCart);
      notifyCartUpdated({ itemCount: previousCount });
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove this item. Please try again.');
    }
  }

  return <div className="cart-layout">
    <div className="cart-items">{error && <p role="alert" className="cart-error">{error}</p>}{cart.items?.map((item) => <article className="cart-item" key={item.id}>
      <div className="cart-item-product">{(item.thumbnail ?? item.variant?.product?.thumbnail ?? item.product?.thumbnail) && <div className="cart-item-image"><Image src={(item.thumbnail ?? item.variant?.product?.thumbnail ?? item.product?.thumbnail) as string} alt={item.product_title ?? item.title ?? 'Product'} fill sizes="96px" /></div>}<div><p className="eyebrow">{item.variant_title ?? 'Product'}</p><h2>{item.product_title ?? item.title}</h2><p className="cart-item-variant">Variant ID: {item.variant_id}</p></div></div>
      <div className="cart-item-actions"><strong>PKR {(item.unit_price ?? 0).toLocaleString()}</strong><div className="cart-quantity"><button type="button" onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} aria-label={`Decrease ${item.product_title ?? item.title}`}>−</button><span>{item.quantity}</span><button type="button" onClick={() => updateItem(item.id, item.quantity + 1)} aria-label={`Increase ${item.product_title ?? item.title}`}>+</button></div><button className="cart-remove" type="button" disabled={pendingItems.has(item.id)} onClick={() => removeItem(item.id)}>Remove</button></div>
    </article>)}</div>
    <aside className="cart-summary"><p className="eyebrow">Summary</p><div><span>Subtotal</span><strong>PKR {(cart.subtotal ?? 0).toLocaleString()}</strong></div><Link href="/checkout" className="button button-gold bg-gradient-gold">Proceed to Checkout <span aria-hidden="true">↗</span></Link></aside>
  </div>;
}
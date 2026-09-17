'use client';

import { useState } from 'react';

type CartItem = {
  id: string;
  title?: string;
  product_title?: string;
  variant_title?: string;
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
  const [busyItem, setBusyItem] = useState<string>();

  async function updateItem(lineItemId: string, quantity: number) {
    setBusyItem(lineItemId);
    const response = await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line_item_id: lineItemId, quantity })
    });
    if (response.ok) setCart((await response.json()).cart);
    setBusyItem(undefined);
  }

  async function removeItem(lineItemId: string) {
    setBusyItem(lineItemId);
    const response = await fetch(`/api/cart?line_item_id=${encodeURIComponent(lineItemId)}`, { method: 'DELETE' });
    if (response.ok) setCart((await response.json()).cart);
    setBusyItem(undefined);
  }

  return <div className="cart-layout">
    <div className="cart-items">{cart.items?.map((item) => <article className="cart-item" key={item.id}>
      <div><p className="eyebrow">{item.variant_title ?? 'Product'}</p><h2>{item.product_title ?? item.title}</h2><p className="cart-item-variant">Variant ID: {item.variant_id}</p></div>
      <div className="cart-item-actions"><strong>PKR {(item.unit_price ?? 0).toLocaleString()}</strong><div className="cart-quantity"><button type="button" disabled={busyItem === item.id} onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} aria-label={`Decrease ${item.product_title ?? item.title}`}>−</button><span>{item.quantity}</span><button type="button" disabled={busyItem === item.id} onClick={() => updateItem(item.id, item.quantity + 1)} aria-label={`Increase ${item.product_title ?? item.title}`}>+</button></div><button className="cart-remove" type="button" disabled={busyItem === item.id} onClick={() => removeItem(item.id)}>Remove</button></div>
    </article>)}</div>
    <aside className="cart-summary"><p className="eyebrow">Summary</p><div><span>Subtotal</span><strong>PKR {(cart.subtotal ?? 0).toLocaleString()}</strong></div><button className="button button-gold bg-gradient-gold" type="button">Proceed to Checkout <span aria-hidden="true">↗</span></button></aside>
  </div>;
}
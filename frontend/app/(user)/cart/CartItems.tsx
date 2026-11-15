'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../../providers/CartProvider';

export function CartItems() {
  const { cart, setCart } = useCart();
  const currentCart = cart;
  if (!currentCart?.items.length) return null;
  const currentItems = currentCart.items;

  function updateItem(lineItemId: string, quantity: number) {
    const items = currentItems
      .map((item) => item.id === lineItemId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0);
    setCart({
      items,
      subtotal: items.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
  }

  function removeItem(lineItemId: string) {
    const items = currentItems.filter((item) => item.id !== lineItemId);
    setCart({
      items,
      subtotal: items.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
  }

  return <div className="cart-layout">
    <div className="cart-items">{currentItems.map((item) => {
      const image = item.thumbnail ?? item.variant?.product?.thumbnail ?? item.product?.thumbnail;
      const name = item.product_title ?? item.title ?? 'Product';
      return <article className="cart-item" key={item.id}>
        <div className="cart-item-product">
          {image && <div className="cart-item-image"><Image src={image} alt={name} fill sizes="96px" unoptimized /></div>}
          <div>
            <p className="eyebrow">{item.variant_title ?? 'Product'}</p>
            <h2>{name}</h2>
            <p className="cart-item-variant">PKR {(item.unit_price ?? 0).toLocaleString()} each</p>
          </div>
        </div>
        <div className="cart-item-actions">
          <strong>PKR {((item.unit_price ?? 0) * item.quantity).toLocaleString()}</strong>
          <div className="cart-quantity">
            <button type="button" onClick={() => updateItem(item.id, item.quantity - 1)} aria-label={`Decrease ${name}`}>−</button>
            <span>{item.quantity}</span>
            <button type="button" onClick={() => updateItem(item.id, item.quantity + 1)} aria-label={`Increase ${name}`}>+</button>
          </div>
          <button className="cart-remove" type="button" onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      </article>;
    })}</div>
    <aside className="cart-summary">
      <p className="eyebrow">Summary</p>
      <div><span>Subtotal</span><strong>PKR {currentCart.subtotal.toLocaleString()}</strong></div>
      <Link href="/checkout" className="button button-gold bg-gradient-gold">Proceed to Checkout <span aria-hidden="true">↗</span></Link>
    </aside>
  </div>;
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/content';
import { useCart } from '../../providers/CartProvider';

export function ProductDetailOrder({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { cart, isLoading, setCart } = useCart();
  const currentItem = cart?.items.find((item) => item.id === product._id);

  useEffect(() => {
    setQuantity(currentItem?.quantity ?? 1);
  }, [currentItem?.quantity, product._id]);

  function saveQuantity(nextQuantity: number) {
    setQuantity(nextQuantity);
    if (!currentItem || !cart) return;

    const items = cart.items.map((item) =>
      item.id === product._id ? { ...item, quantity: nextQuantity } : item
    );
    setCart({
      items,
      subtotal: items.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
  }

  function addToCart() {
    if (isLoading) return;
    const items = cart?.items ?? [];
    const existing = items.find((item) => item.id === product._id);
    const nextItems = existing
      ? items.map((item) => item.id === product._id ? { ...item, quantity } : item)
      : [...items, {
        id: product._id,
        title: product.name,
        product_title: product.name,
        product_slug: product.slug,
        thumbnail: product.image?.url ?? null,
        quantity,
        unit_price: product.price
      }];

    setCart({
      items: nextItems,
      subtotal: nextItems.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
  }

  function handleBuyNow() {
    addToCart();
    router.push('/checkout');
  }

  return <>
    <p className="product-detail-price">PKR {product.price.toLocaleString()}</p>

    <div className="quantity-control" aria-label="Quantity selector">
      <span>Quantity</span>
      <button type="button" disabled={isLoading} onClick={() => saveQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
      <strong>{quantity}</strong>
      <button type="button" disabled={isLoading} onClick={() => saveQuantity(quantity + 1)} aria-label="Increase quantity">+</button>
    </div>

    <div className="product-detail-actions">
      <button
        className={`button ${currentItem ? 'button-in-cart' : 'button-outline'}`}
        type="button"
        onClick={addToCart}
        disabled={isLoading || Boolean(currentItem)}
        aria-label={currentItem ? 'This product is already in your cart' : 'Add to cart'}
      >
        {currentItem ? '✓ In Cart' : '🛍 Add to Cart'}
      </button>
      <button className="button button-gold bg-gradient-gold" type="button" onClick={handleBuyNow} disabled={isLoading}>
        Buy Now <span aria-hidden="true">⚡</span>
      </button>
    </div>
  </>;
}

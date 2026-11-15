'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, ProductVariant } from '@/lib/content';
import { useCart } from '../../providers/CartProvider';

export function ProductDetailOrder({ product }: { product: Product }) {
  const variants: ProductVariant[] = product.variants?.length
    ? product.variants
    : [{ id: product._id, title: 'Default', options: [], price: product.price }];
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0].id);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { cart, isLoading, setCart } = useCart();
  const currentItem = cart?.items.find((item) => item.variant_id === selectedVariant.id);

  useEffect(() => {
    setQuantity(currentItem?.quantity ?? 1);
  }, [currentItem?.quantity, selectedVariant.id]);

  function saveQuantity(nextQuantity: number) {
    setQuantity(nextQuantity);
    if (!currentItem) return;

    const items = (cart?.items ?? []).map((item) =>
      item.variant_id === selectedVariant.id ? { ...item, quantity: nextQuantity } : item
    );
    setCart({
      items,
      subtotal: items.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
  }

  function addToCart() {
    if (isLoading || isAdding) return;
    setIsAdding(true);
    const items = cart?.items ?? [];
    const existing = items.find((item) => item.variant_id === selectedVariant.id);
    const nextItems = existing
      ? items.map((item) => item.variant_id === selectedVariant.id
        ? { ...item, quantity }
        : item)
      : [...items, {
        id: selectedVariant.id,
        variant_id: selectedVariant.id,
        title: product.name,
        product_title: product.name,
        product_slug: product.slug,
        variant_title: selectedVariant.title === 'Default' ? undefined : selectedVariant.title,
        thumbnail: product.image?.url ?? null,
        quantity,
        unit_price: selectedVariant.price
      }];

    setCart({
      items: nextItems,
      subtotal: nextItems.reduce((total, item) => total + (item.unit_price ?? 0) * item.quantity, 0)
    });
    setQuantity(existing ? existing.quantity + quantity : quantity);
    setIsAdding(false);
  }

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    const item = cart?.items.find((cartItem) => cartItem.variant_id === variantId);
    setQuantity(item?.quantity ?? 1);
  }

  function handleBuyNow() {
    addToCart();
    router.push('/checkout');
  }

  return <>
    {variants.length > 1 && (
      <fieldset className="variant-selector">
        <legend>Choose a size</legend>
        <div className="variant-options">
          {variants.map((variant) => (
            <button
              className={variant.id === selectedVariant.id ? 'variant-option is-selected' : 'variant-option'}
              key={variant.id}
              type="button"
              onClick={() => selectVariant(variant.id)}
              aria-pressed={variant.id === selectedVariant.id}
            >
              {variant.options.join(' / ') || variant.title}
            </button>
          ))}
        </div>
      </fieldset>
    )}

    <p className="product-detail-price">PKR {selectedVariant.price.toLocaleString()}</p>

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
        disabled={isLoading || isAdding || Boolean(currentItem)}
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

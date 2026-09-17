'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductVariant } from '@/lib/content';

type ProductDetailProps = { variants: ProductVariant[] };

export function ProductDetailOrder({ variants }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const hasMultipleVariants = variants.length > 1;

  async function addToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);
    setError('');
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: selectedVariant.id, quantity })
      });
      if (!response.ok) throw new Error('Unable to add this item to your cart.');
      router.push('/cart');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add this item to your cart.');
      setIsAdding(false);
    }
  }

  return <>
    {hasMultipleVariants && <fieldset className="variant-selector"><legend>Choose a size</legend><div className="variant-options">{variants.map((variant) => <button className={variant.id === selectedVariant?.id ? 'variant-option is-selected' : 'variant-option'} key={variant.id} type="button" onClick={() => setSelectedVariantId(variant.id)} aria-pressed={variant.id === selectedVariant?.id}>{variant.options.join(' / ') || variant.title}</button>)}</div></fieldset>}
    <p className="product-detail-price">PKR {(selectedVariant?.price ?? 0).toLocaleString()}</p>
    <div className="quantity-control" aria-label="Quantity selector"><span>Quantity</span><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity">+</button></div>
    <button className="button button-gold bg-gradient-gold" type="button" onClick={addToCart} disabled={isAdding}>{isAdding ? 'Adding to cart...' : 'Add to Cart'} <span aria-hidden="true">↗</span></button>
    {error && <p role="alert" className="cart-error">{error}</p>}
  </>;
}

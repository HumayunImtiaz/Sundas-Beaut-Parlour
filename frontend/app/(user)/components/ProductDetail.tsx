'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductVariant } from '@/lib/content';
import { notifyCartUpdated } from '@/lib/cart-events';

type ProductDetailProps = { variants: ProductVariant[] };

/** Tracks a variant that has been successfully added to the Medusa cart. */
type AddedEntry = {
  lineItemId: string;  // The Medusa line-item ID — needed for PATCH updates
  quantity: number;    // The quantity that is currently synced in the cart
};

type CartItemRaw = { id: string; variant_id?: string; quantity: number };
type CartRaw     = { items?: CartItemRaw[] };

export function ProductDetailOrder({ variants }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];
  const hasMultipleVariants = variants.length > 1;

  const [quantity, setQuantity] = useState(1);

  /**
   * Map of variantId → AddedEntry for every variant the user has
   * added in this session. Persists when the user switches variants.
   */
  const [addedVariants, setAddedVariants] = useState<Map<string, AddedEntry>>(new Map());
  const currentEntry = selectedVariant ? addedVariants.get(selectedVariant.id) : undefined;
  const isInCart = Boolean(currentEntry);

  // Independent per-button loading flags
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCheckingOut,  setIsCheckingOut]  = useState(false);
  const [isSyncing,      setIsSyncing]      = useState(false); // background qty sync
  const [error, setError] = useState('');

  // Prevents two simultaneous POST requests
  const addInFlight = useRef(false);

  // Version counter for PATCH debounce (same pattern as CartItems)
  const syncVersionRef = useRef(0);

  const router = useRouter();

  // ─── POST: add a new line item ──────────────────────────────────────────────

  async function doAdd(setMyLoading: (v: boolean) => void): Promise<boolean> {
    if (!selectedVariant || addInFlight.current) return false;
    addInFlight.current = true;
    setMyLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: selectedVariant.id, quantity })
      });
      if (!response.ok) throw new Error('Unable to add this item to your cart.');

      const data = await response.json() as { cart?: CartRaw | null };
      const items = data.cart?.items ?? [];

      // Locate the line item Medusa created/merged for this variant
      const lineItem = items.find((item) => item.variant_id === selectedVariant.id);
      const serverCount = items.reduce((t, i) => t + i.quantity, 0);
      notifyCartUpdated({ itemCount: serverCount });

      if (lineItem) {
        setAddedVariants((prev) => {
          const next = new Map(prev);
          next.set(selectedVariant.id, { lineItemId: lineItem.id, quantity: lineItem.quantity });
          return next;
        });
        // Sync displayed quantity to what the server confirmed
        setQuantity(lineItem.quantity);
      }

      setMyLoading(false);
      addInFlight.current = false;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add this item to your cart.');
      setMyLoading(false);
      addInFlight.current = false;
      return false;
    }
  }

  // ─── PATCH: update an existing line item's quantity ─────────────────────────

  async function syncQuantity(lineItemId: string, newQty: number, previousQty: number) {
    const version = ++syncVersionRef.current;
    setIsSyncing(true);
    setError('');

    // Optimistic navbar update
    // We don't know the full cart count here, so use delta
    notifyCartUpdated({ delta: newQty - previousQty });
    window.setTimeout(() => setIsSyncing(false), 400);

    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_item_id: lineItemId, quantity: newQty })
      });
      if (!response.ok) throw new Error('Unable to update cart quantity.');

      const data = await response.json() as { cart?: CartRaw | null };
      if (version !== syncVersionRef.current) return; // stale — a newer PATCH is in-flight

      const items = data.cart?.items ?? [];
      const serverCount = items.reduce((t, i) => t + i.quantity, 0);
      notifyCartUpdated({ itemCount: serverCount });

      // Update stored quantity for this entry
      setAddedVariants((prev) => {
        const entry = prev.get(selectedVariant!.id);
        if (!entry) return prev;
        const next = new Map(prev);
        next.set(selectedVariant!.id, { ...entry, quantity: newQty });
        return next;
      });
    } catch (err) {
      if (version !== syncVersionRef.current) return;
      // Roll back optimistic delta
      notifyCartUpdated({ delta: previousQty - newQty });
      setError(err instanceof Error ? err.message : 'Unable to update cart quantity.');
      setQuantity(previousQty); // restore the UI
    }
  }

  // ─── Quantity change handler ─────────────────────────────────────────────────

  function changeQuantity(delta: 1 | -1) {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);

    if (currentEntry) {
      // Variant is already in cart — PATCH instead of waiting for another Add click
      // Pass the current local state 'quantity' as the previous value, NOT the stale currentEntry.quantity
      void syncQuantity(currentEntry.lineItemId, newQty, quantity);
    }
  }

  // ─── Button handlers ─────────────────────────────────────────────────────────

  async function handleAddToCart() {
    await doAdd(setIsAddingToCart);
    // No reset timer — button stays as "In Cart" until variant changes
  }

  async function handleCheckout() {
    if (isInCart && currentEntry && quantity !== currentEntry.quantity) {
      // Quantity was changed since last sync — make sure cart is up to date first
      await syncQuantity(currentEntry.lineItemId, quantity, currentEntry.quantity);
    } else if (!isInCart) {
      const ok = await doAdd(setIsCheckingOut);
      if (!ok) return;
    }
    router.push('/cart');
  }

  // ─── Variant switch ──────────────────────────────────────────────────────────

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setError('');
    // Restore quantity to whatever was last synced for this variant, or 1
    const entry = addedVariants.get(variantId);
    setQuantity(entry?.quantity ?? 1);
  }

  // ─── Derived flags ───────────────────────────────────────────────────────────

  const anyBusy = isAddingToCart || isCheckingOut || isSyncing;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return <>
    {hasMultipleVariants && (
      <fieldset className="variant-selector">
        <legend>Choose a size</legend>
        <div className="variant-options">
          {variants.map((variant) => (
            <button
              className={variant.id === selectedVariant?.id ? 'variant-option is-selected' : 'variant-option'}
              key={variant.id}
              type="button"
              onClick={() => selectVariant(variant.id)}
              aria-pressed={variant.id === selectedVariant?.id}
            >
              {variant.options.join(' / ') || variant.title}
            </button>
          ))}
        </div>
      </fieldset>
    )}

    <p className="product-detail-price">PKR {(selectedVariant?.price ?? 0).toLocaleString()}</p>

    <div className="quantity-control" aria-label="Quantity selector">
      <span>Quantity{isSyncing && <span className="qty-syncing" aria-label="Syncing"> <span className="spinner spinner-sm" aria-hidden="true"></span></span>}</span>
      <button type="button" disabled={anyBusy} onClick={() => changeQuantity(-1)} aria-label="Decrease quantity">−</button>
      <strong>{quantity}</strong>
      <button type="button" disabled={anyBusy} onClick={() => changeQuantity(1)} aria-label="Increase quantity">+</button>
    </div>

    <div className="product-detail-actions">
      {/* "Add to Cart" — disabled once the variant is in the cart */}
      <button
        className={`button ${isInCart ? 'button-in-cart' : 'button-outline'}`}
        type="button"
        onClick={isInCart ? undefined : handleAddToCart}
        disabled={isAddingToCart || isInCart}
        aria-label={isInCart ? 'This variant is already in your cart' : 'Add to cart'}
      >
        {isAddingToCart
          ? <><span className="spinner" aria-hidden="true"></span> Adding...</>
          : isInCart
            ? '✓ In Cart'
            : '🛍 Add to Cart'}
      </button>

      {/* "Checkout" — always enabled */}
      <button
        className="button button-gold bg-gradient-gold"
        type="button"
        onClick={handleCheckout}
        disabled={isCheckingOut}
      >
        {isCheckingOut
          ? <><span className="spinner" aria-hidden="true"></span> Adding...</>
          : <>Checkout <span aria-hidden="true">↗</span></>}
      </button>
    </div>

    {error && <p role="alert" className="cart-error">{error}</p>}
  </>;
}

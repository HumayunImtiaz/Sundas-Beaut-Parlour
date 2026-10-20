'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductVariant } from '@/lib/content';
import { notifyCartUpdated } from '@/lib/cart-events';
import { queueCartQuantityUpdate } from '@/lib/cart-sync';
import { useCart } from '../../providers/CartProvider';
import type { CartData } from '../../providers/CartProvider';

type ProductDetailProps = { variants: ProductVariant[] };

/** Tracks a variant that has been successfully added to the Medusa cart. */
type AddedEntry = {
  lineItemId: string;  // The Medusa line-item ID — needed for PATCH updates
  quantity: number;    // The quantity that is currently synced in the cart
};

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
  const [isBuyingNow,    setIsBuyingNow]    = useState(false);
  const [isSyncing,      setIsSyncing]      = useState(false); // background qty sync
  const [error, setError] = useState('');

  // Prevents two simultaneous POST requests
  const addInFlight = useRef(false);
  const selectedVariantIdRef = useRef(selectedVariantId);

  const router = useRouter();
  const { setCart } = useCart();

  // ─── POST: add a new line item ──────────────────────────────────────────────

  async function doAdd(setMyLoading: (v: boolean) => void): Promise<boolean> {
    if (!selectedVariant || addInFlight.current) return false;
    addInFlight.current = true;
    setMyLoading(true);
    setError('');

    // ── Optimistic update: show "In Cart" immediately ──────────────────────
    const optimisticEntry: AddedEntry = { lineItemId: '__optimistic__', quantity };
    setAddedVariants((prev) => {
      const next = new Map(prev);
      next.set(selectedVariant.id, optimisticEntry);
      return next;
    });
    notifyCartUpdated({ delta: quantity }); // bump navbar badge right away

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: selectedVariant.id, quantity })
      });
      if (!response.ok) throw new Error('Unable to add this item to your cart.');

      const data = await response.json() as { cart?: CartData | null };
      const items = data.cart?.items ?? [];
      setCart(data.cart ?? null);

      // Replace optimistic entry with real server data
      const lineItem = items.find((item) => item.variant_id === selectedVariant.id);
      const serverCount = items.reduce((t, i) => t + i.quantity, 0);
      notifyCartUpdated({ itemCount: serverCount });

      if (lineItem) {
        setAddedVariants((prev) => {
          const next = new Map(prev);
          next.set(selectedVariant.id, { lineItemId: lineItem.id, quantity: lineItem.quantity });
          return next;
        });
        setQuantity(lineItem.quantity);
      }

      setMyLoading(false);
      addInFlight.current = false;
      return true;
    } catch (err) {
      // ── Rollback optimistic update on error ──────────────────────────────
      setAddedVariants((prev) => {
        const next = new Map(prev);
        next.delete(selectedVariant.id);
        return next;
      });
      notifyCartUpdated({ delta: -quantity }); // revert navbar badge
      setError(err instanceof Error ? err.message : 'Unable to add this item to your cart.');
      setMyLoading(false);
      addInFlight.current = false;
      return false;
    }
  }

  // ─── PATCH: update an existing line item's quantity ─────────────────────────

  async function syncQuantity(
    lineItemId: string,
    newQty: number,
    previousQty: number,
    baseQty: number,
    variantId: string,
  ): Promise<boolean> {
    setIsSyncing(true);
    setError('');

    notifyCartUpdated({ delta: newQty - previousQty });

    try {
      await queueCartQuantityUpdate<CartData>(lineItemId, newQty, {
        onSuccess: (serverCart) => {
          setCart(serverCart);
          const items = serverCart.items ?? [];
          notifyCartUpdated({ itemCount: items.reduce((total, item) => total + item.quantity, 0) });
          const serverQuantity = items.find((item) => item.id === lineItemId)?.quantity ?? newQty;
          setAddedVariants((previous) => {
            const entry = previous.get(variantId);
            if (!entry) return previous;
            const next = new Map(previous);
            next.set(variantId, { ...entry, quantity: serverQuantity });
            return next;
          });
          if (selectedVariantIdRef.current === variantId) setQuantity(serverQuantity);
          setIsSyncing(false);
        },
        onError: (requestError) => {
          notifyCartUpdated({ delta: baseQty - newQty });
          setError(requestError.message);
          if (selectedVariantIdRef.current === variantId) setQuantity(baseQty);
          setIsSyncing(false);
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  // ─── Quantity change handler ─────────────────────────────────────────────────

  function changeQuantity(delta: 1 | -1) {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);

    if (currentEntry) {
      void syncQuantity(currentEntry.lineItemId, newQty, quantity, currentEntry.quantity, selectedVariant!.id);
    }
  }

  // ─── Button handlers ─────────────────────────────────────────────────────────

  async function handleAddToCart() {
    await doAdd(setIsAddingToCart);
    // No reset timer — button stays as "In Cart" until variant changes
  }

  async function handleBuyNow() {
    if (isInCart && currentEntry && quantity !== currentEntry.quantity) {
      const synced = await syncQuantity(
        currentEntry.lineItemId,
        quantity,
        quantity,
        currentEntry.quantity,
        selectedVariant!.id,
      );
      if (!synced) return;
    } else if (!isInCart) {
      const ok = await doAdd(setIsBuyingNow);
      if (!ok) return;
    }
    router.push('/checkout');
  }

  // ─── Variant switch ──────────────────────────────────────────────────────────

  function selectVariant(variantId: string) {
    selectedVariantIdRef.current = variantId;
    setSelectedVariantId(variantId);
    setError('');
    // Restore quantity to whatever was last synced for this variant, or 1
    const entry = addedVariants.get(variantId);
    setQuantity(entry?.quantity ?? 1);
  }

  // ─── Derived flags ───────────────────────────────────────────────────────────

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
      <button type="button" disabled={isAddingToCart || isBuyingNow} onClick={() => changeQuantity(-1)} aria-label="Decrease quantity">−</button>
      <strong>{quantity}</strong>
      <button type="button" disabled={isAddingToCart || isBuyingNow} onClick={() => changeQuantity(1)} aria-label="Increase quantity">+</button>
    </div>

    <div className="product-detail-actions">
      {/* "Add to Cart" — disabled once the variant is in the cart */}
      <button
        className={`button ${isInCart ? 'button-in-cart' : 'button-outline'}`}
        type="button"
        onClick={isInCart ? undefined : handleAddToCart}
        disabled={isInCart}
        aria-label={isInCart ? 'This variant is already in your cart' : 'Add to cart'}
      >
        {isInCart
          ? <>{isAddingToCart && <span className="spinner spinner-sm" aria-hidden="true" style={{ marginRight: '6px' }} />}✓ In Cart</>
          : '🛍 Add to Cart'}
      </button>

      {/* "Buy Now" — always enabled, skips to checkout */}
      <button
        className="button button-gold bg-gradient-gold"
        type="button"
        onClick={handleBuyNow}
        disabled={isBuyingNow}
      >
        {isBuyingNow
          ? <><span className="spinner" aria-hidden="true"></span> Loading...</>
          : <>Buy Now <span aria-hidden="true">⚡</span></>}
      </button>
    </div>

    {error && <p role="alert" className="cart-error">{error}</p>}
  </>;
}

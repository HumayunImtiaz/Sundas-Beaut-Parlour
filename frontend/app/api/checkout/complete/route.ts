import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sdk, MEDUSA_CART_COOKIE } from '@/lib/medusa';

// Fields needed to run initiatePaymentSession (cart object must include region_id + payment_collection)
const CHECKOUT_CART_FIELDS = '*payment_collection,*payment_collection.payment_sessions';

export async function POST() {
  const cartId = cookies().get(MEDUSA_CART_COOKIE)?.value;

  if (!cartId) {
    return NextResponse.json({ error: 'No active cart found.' }, { status: 400 });
  }

  try {
    // ── Step 1: Retrieve the cart so initiatePaymentSession has the full object ──
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: CHECKOUT_CART_FIELDS,
    });

    // ── Step 2: Initiate a payment session for COD (Medusa's built-in manual/system provider)
    //    sdk.store.payment.initiatePaymentSession(cart, { provider_id }) handles:
    //      a) Creating a payment collection if one doesn't exist yet
    //      b) Initialising a payment session for the chosen provider
    //    This matches the official Medusa v2 storefront checkout flow:
    //    https://docs.medusajs.com/resources/storefront-development/checkout/payment
    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: 'pp_system_default', // Medusa's built-in manual/COD provider
    });

    // ── Step 3: Complete the cart → places the real order ────────────────────
    const result = await sdk.store.cart.complete(cartId);

    if (result.type === 'order') {
      const order = result.order as { id: string; display_id?: number };
      return NextResponse.json({
        order: {
          id: order.id,
          display_id: order.display_id,
        },
      });
    }

    // Medusa returned a cart — unexpected, surface the cart's error if available
    const cartResult = result as { cart?: { metadata?: { error?: string } } };
    const cartError = cartResult.cart?.metadata?.error ?? 'Order could not be completed. Please try again.';
    return NextResponse.json({ error: cartError }, { status: 422 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[checkout/complete]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

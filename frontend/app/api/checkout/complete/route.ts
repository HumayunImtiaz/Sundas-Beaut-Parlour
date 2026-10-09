import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sdk, MEDUSA_CART_COOKIE } from '@/lib/medusa';

/**
 * Medusa v2 checkout-complete for COD (Cash on Delivery).
 *
 * Before `cart.complete()` can succeed, Medusa requires:
 *   1. Cart has an email + shipping address + billing address
 *   2. A shipping method is selected
 *   3. A payment collection exists with an active payment session
 *
 * This route handles ALL of those steps so the frontend only needs one call.
 */

// Fields we need to read back from the cart after updates
const CART_FIELDS =
  '+payment_collection.id,+payment_collection.payment_sessions';

type CheckoutBody = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
};

export async function POST(request: Request) {
  const cartId = cookies().get(MEDUSA_CART_COOKIE)?.value;

  if (!cartId) {
    return NextResponse.json(
      { error: 'No active cart found.' },
      { status: 400 }
    );
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (!body.email || !body.firstName || !body.lastName || !body.address || !body.city || !body.phone) {
    return NextResponse.json(
      { error: 'All contact and address fields are required.' },
      { status: 400 }
    );
  }

  try {
    // ── Step 1: Update the cart with customer info ─────────────────────────
    // Medusa requires email, shipping_address, and billing_address before
    // a cart can be completed.
    const shippingAddress = {
      first_name: body.firstName,
      last_name: body.lastName,
      address_1: body.address,
      city: body.city,
      postal_code: body.postalCode || '00000',
      country_code: 'pk',
      phone: body.phone,
    };

    await sdk.store.cart.update(cartId, {
      email: body.email,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
    });

    // ── Step 2: Add a shipping method (if not already set) ────────────────
    // Medusa won't let you complete a cart without a shipping option selected.
    // We pick the first available option for this cart.
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    });

    if (shipping_options && shipping_options.length > 0) {
      // Always set/overwrite the shipping method to avoid stale-state issues
      await sdk.store.cart.addShippingMethod(cartId, {
        option_id: shipping_options[0].id,
      });
    }

    // ── Step 3: Retrieve the cart with payment_collection info ─────────────
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: CART_FIELDS,
    });

    // ── Step 4: Initialize payment collection + session (COD / manual) ────
    // The SDK's initiatePaymentSession helper will:
    //   a) Create a payment collection if the cart doesn't have one
    //   b) Create a payment session for the given provider
    // "pp_system_default" is Medusa's built-in manual/system provider for COD.
    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: 'pp_system_default',
    });

    // ── Step 5: Complete the cart → create the Medusa order ────────────────
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

    // Medusa returned a cart instead of an order — surface the error
    const cartResult = result as {
      error?: string;
      cart?: { metadata?: { error?: string } };
    };
    const cartError =
      cartResult.error ??
      cartResult.cart?.metadata?.error ??
      'Order could not be completed. Please try again.';
    return NextResponse.json({ error: cartError }, { status: 422 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[checkout/complete]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

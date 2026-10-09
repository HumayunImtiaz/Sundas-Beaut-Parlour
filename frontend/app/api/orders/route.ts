import { NextResponse } from 'next/server';
import { sdk } from '@/lib/medusa';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim();

  if (!email) {
    return NextResponse.json({ error: 'email query param is required.' }, { status: 400 });
  }

  try {
    // Medusa store order list — fetch all orders for this email
    const fields = [
      '+metadata',
      '*items',
      '*items.variant',
      '*items.variant.product',
      '*items.product',
      '*payment_collections',
      '*fulfillments',
    ].join(',');

    const result = await sdk.store.order.list({ email, fields } as Parameters<typeof sdk.store.order.list>[0]);

    return NextResponse.json({ orders: (result as { orders?: unknown[] }).orders ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/orders]', msg);
    return NextResponse.json({ orders: [], error: msg });
  }
}

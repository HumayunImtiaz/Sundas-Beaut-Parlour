import { NextResponse } from 'next/server';
import { addMedusaLineItem, removeMedusaLineItem, updateMedusaLineItem } from '@/lib/medusa';

export async function POST(request: Request) {
  const body = await request.json() as { variant_id?: string; quantity?: number };
  if (!body.variant_id || !body.quantity || body.quantity < 1) {
    return NextResponse.json({ error: 'A variant and quantity are required.' }, { status: 400 });
  }

  const cart = await addMedusaLineItem(body.variant_id, body.quantity);
  return NextResponse.json({ cart });
}

export async function PATCH(request: Request) {
  const body = await request.json() as { line_item_id?: string; quantity?: number };
  if (!body.line_item_id || !body.quantity || body.quantity < 1) {
    return NextResponse.json({ error: 'A line item and quantity are required.' }, { status: 400 });
  }

  const cart = await updateMedusaLineItem(body.line_item_id, body.quantity);
  return NextResponse.json({ cart });
}

export async function DELETE(request: Request) {
  const lineItemId = new URL(request.url).searchParams.get('line_item_id');
  if (!lineItemId) return NextResponse.json({ error: 'A line item is required.' }, { status: 400 });

  const cart = await removeMedusaLineItem(lineItemId);
  return NextResponse.json({ cart });
}
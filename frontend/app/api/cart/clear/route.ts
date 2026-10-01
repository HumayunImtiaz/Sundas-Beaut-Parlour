import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MEDUSA_CART_COOKIE } from '@/lib/medusa';

export async function DELETE() {
  cookies().delete(MEDUSA_CART_COOKIE);
  return NextResponse.json({ cleared: true });
}

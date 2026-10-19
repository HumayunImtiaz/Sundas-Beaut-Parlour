import { NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'http://localhost:9000';
const orderFields =
  'id,display_id,created_at,total,+metadata,*items,*items.variant,*items.variant.product,*items.product,*shipping_address';
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;
const LOOKUP_LIMIT = 5;
const savedOrdersLimit = 25;

type SavedOrder = {
  orderId: string;
  phone: string;
};

type LookupOrder = {
  orderNumber: string;
  phone: string;
};

type MedusaOrderItem = {
  title?: string | null;
  product_title?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  thumbnail?: string | null;
  product?: { title?: string | null; thumbnail?: string | null } | null;
  variant?: {
    product?: { title?: string | null; thumbnail?: string | null } | null;
  } | null;
};

type MedusaOrder = {
  id: string;
  display_id?: number | null;
  created_at?: string | null;
  total?: number | null;
  metadata?: { delivery_status?: string | null } | null;
  shipping_address?: { phone?: string | null } | null;
  items?: MedusaOrderItem[] | null;
};

type PublicOrder = {
  orderNumber: number;
  date: string | null;
  items: {
    name: string;
    thumbnail: string | null;
    quantity: number;
    price: number;
  }[];
  total: number;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending' | 'Confirmed' | 'Delivered';
};

const lookupAttempts = new Map<string, number[]>();

function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidPhone(phone: unknown): phone is string {
  if (typeof phone !== 'string') return false;
  const digits = getPhoneDigits(phone);
  return digits.length >= 7 && digits.length <= 15;
}

function getClientAddress(request: Request): string {
  const directAddress = request.headers.get('x-real-ip');
  if (directAddress) return directAddress;
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function takeLookupAttempt(address: string): boolean {
  const now = Date.now();
  const recentAttempts = (lookupAttempts.get(address) ?? []).filter(
    (timestamp) => now - timestamp < LOOKUP_WINDOW_MS
  );

  if (recentAttempts.length >= LOOKUP_LIMIT) {
    lookupAttempts.set(address, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  lookupAttempts.set(address, recentAttempts);

  if (lookupAttempts.size > 1000) {
    for (const [key, timestamps] of lookupAttempts) {
      if (timestamps.every((timestamp) => now - timestamp >= LOOKUP_WINDOW_MS)) {
        lookupAttempts.delete(key);
      }
    }
  }

  return true;
}

function getDeliveryStatus(order: MedusaOrder): PublicOrder['status'] {
  switch (order.metadata?.delivery_status?.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Pending';
  }
}

function toPublicOrder(order: MedusaOrder): PublicOrder | null {
  if (!Number.isSafeInteger(order.display_id)) return null;

  return {
    orderNumber: order.display_id as number,
    date: order.created_at ?? null,
    items: (order.items ?? []).map((item) => ({
      name:
        item.product_title ??
        item.variant?.product?.title ??
        item.product?.title ??
        item.title ??
        item.variant_title ??
        'Product',
      thumbnail:
        item.thumbnail ??
        item.variant?.product?.thumbnail ??
        item.product?.thumbnail ??
        null,
      quantity: item.quantity ?? 0,
      price: item.unit_price ?? 0,
    })),
    total: order.total ?? 0,
    paymentMethod: 'Cash on Delivery',
    status: getDeliveryStatus(order),
  };
}

function getAdminHeaders(): HeadersInit {
  const apiKey = process.env.MEDUSA_ADMIN_API_KEY;
  if (!apiKey) {
    throw new Error('MEDUSA_ADMIN_API_KEY is not configured.');
  }
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
    'Content-Type': 'application/json',
  };
}

async function fetchAdminOrder(orderId: string): Promise<MedusaOrder | null> {
  const response = await fetch(
    `${backendUrl}/admin/orders/${encodeURIComponent(orderId)}?fields=${encodeURIComponent(orderFields)}`,
    { headers: getAdminHeaders(), cache: 'no-store' }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Medusa Admin API returned ${response.status}.`);
  }

  const result = (await response.json()) as { order?: MedusaOrder };
  return result.order ?? null;
}

async function fetchAdminOrderByNumber(orderNumber: number): Promise<MedusaOrder | null> {
  const url = new URL('/admin/orders', backendUrl);
  url.searchParams.set('display_id', String(orderNumber));
  url.searchParams.set('fields', orderFields);
  const response = await fetch(url, {
    headers: getAdminHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Medusa Admin API returned ${response.status}.`);
  }

  const result = (await response.json()) as { orders?: MedusaOrder[] };
  return result.orders?.find((order) => order.display_id === orderNumber) ?? null;
}

function isSavedOrder(value: unknown): value is SavedOrder {
  if (!value || typeof value !== 'object') return false;
  const pair = value as Partial<SavedOrder>;
  return (
    typeof pair.orderId === 'string' &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(pair.orderId) &&
    isValidPhone(pair.phone)
  );
}

export async function POST(request: Request) {
  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const body = parsedBody as { orders?: unknown; lookup?: unknown };

  const ordersInput = body.orders ?? [];
  if (!Array.isArray(ordersInput) || ordersInput.length > savedOrdersLimit) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!ordersInput.every(isSavedOrder)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  let lookup: LookupOrder | undefined;
  if (body.lookup !== undefined) {
    const candidate =
      body.lookup && typeof body.lookup === 'object'
        ? (body.lookup as Partial<LookupOrder>)
        : null;
    const orderNumber = typeof candidate?.orderNumber === 'string'
      ? candidate.orderNumber.replace(/^#/, '').trim()
      : '';
    if (
      !candidate ||
      !/^\d{1,12}$/.test(orderNumber) ||
      !isValidPhone(candidate.phone)
    ) {
      return NextResponse.json(
        { error: 'We could not verify an order with those details.' },
        { status: 200 }
      );
    }

    if (!takeLookupAttempt(getClientAddress(request))) {
      return NextResponse.json(
        { error: 'We could not verify an order with those details. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
    lookup = { orderNumber, phone: candidate.phone };
  }

  try {
    const savedOrders = await Promise.all(
      ordersInput.map(async (pair) => {
        const order = await fetchAdminOrder(pair.orderId);
        if (
          !order ||
          getPhoneDigits(order.shipping_address?.phone ?? '') !== getPhoneDigits(pair.phone)
        ) {
          return null;
        }
        return toPublicOrder(order);
      })
    );

    let trackedOrder: PublicOrder | null = null;
    if (lookup) {
      const order = await fetchAdminOrderByNumber(Number(lookup.orderNumber));
      if (
        order &&
        getPhoneDigits(order.shipping_address?.phone ?? '') === getPhoneDigits(lookup.phone)
      ) {
        trackedOrder = toPublicOrder(order);
      }
    }

    return NextResponse.json(
      {
        orders: savedOrders.filter((order): order is PublicOrder => order !== null),
        trackedOrder,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[api/orders] Failed to fetch orders from Medusa Admin API.', error);
    return NextResponse.json(
      { error: 'Orders could not be loaded right now. Please try again later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

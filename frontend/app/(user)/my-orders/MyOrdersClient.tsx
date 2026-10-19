'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

type SavedOrder = {
  orderId: string;
  phone: string;
};

type OrderItem = {
  name: string;
  thumbnail: string | null;
  quantity: number;
  price: number;
};

type Order = {
  orderNumber: number;
  date: string | null;
  items: OrderItem[];
  total: number;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending' | 'Confirmed' | 'Delivered';
};

type OrdersResponse = {
  orders?: Order[];
  trackedOrder?: Order | null;
  error?: string;
};

const LS_ORDER_IDS_KEY = 'sundas_order_ids';
const LS_IDENTITY_KEY = 'sundas_customer_identity';
const TRACK_ERROR = 'We could not find an order matching those details. Check the order number and phone number, then try again.';

function getSavedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(LS_ORDER_IDS_KEY);
    if (!raw) return [];

    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];

    let legacyPhone = '';
    try {
      const identity = JSON.parse(localStorage.getItem(LS_IDENTITY_KEY) ?? '{}') as {
        phone?: string;
      };
      legacyPhone = identity.phone ?? '';
    } catch {
      // Ignore the obsolete identity entry; current order records include their own phone.
    }

    return saved.flatMap((entry): SavedOrder[] => {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.orderId === 'string' &&
        typeof entry.phone === 'string'
      ) {
        return [{ orderId: entry.orderId, phone: entry.phone }];
      }
      if (typeof entry === 'string' && legacyPhone) {
        return [{ orderId: entry, phone: legacyPhone }];
      }
      return [];
    });
  } catch (error) {
    console.error('[my-orders] Could not read saved orders from this browser.', error);
    return [];
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function OrderCard({ order }: { order: Order }) {
  const statusClass = `order-status-${order.status.toLowerCase()}`;

  return (
    <article className="order-card reveal">
      <div className="order-card-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '6px' }}>
            Order #{order.orderNumber}
          </p>
          <p className="order-card-date">{formatDate(order.date)}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span className={`order-status-badge ${statusClass}`}>{order.status}</span>
          <span className="order-payment-badge">{order.paymentMethod}</span>
        </div>
      </div>

      <div className="order-items">
        {order.items.map((item, index) => (
          <div key={`${order.orderNumber}-${index}`} className="order-item-row">
            <div className="order-item-info">
              {item.thumbnail && (
                <Image
                  className="order-item-thumbnail"
                  src={item.thumbnail}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                />
              )}
              <span className="order-item-name">{item.name}</span>
            </div>
            <div className="order-item-right">
              <span className="order-item-qty">× {item.quantity}</span>
              <span className="order-item-price">
                PKR {(item.price * item.quantity).toLocaleString('en-PK')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="order-card-footer">
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
        </span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>
            Total
          </span>
          <strong className="order-total">PKR {order.total.toLocaleString('en-PK')}</strong>
        </div>
      </div>
    </article>
  );
}

export function MyOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedOrders = getSavedOrders();

    void (async () => {
      try {
        const loadedOrders: Order[] = [];
        for (let index = 0; index < savedOrders.length; index += 25) {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: savedOrders.slice(index, index + 25) }),
            cache: 'no-store',
          });
          const result = (await response.json()) as OrdersResponse;
          if (!response.ok || result.error) {
            throw new Error(result.error ?? 'Could not load orders.');
          }
          loadedOrders.push(...(result.orders ?? []));
        }
        setOrders(loadedOrders);
      } catch {
        setLoadError('Orders could not be loaded right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleTrackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTracking(true);
    setTrackedOrder(null);
    setTrackingMessage(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookup: { orderNumber: orderNumber.trim(), phone: phone.trim() },
        }),
        cache: 'no-store',
      });
      const result = (await response.json()) as OrdersResponse;

      if (!response.ok) {
        setTrackingMessage(result.error ?? TRACK_ERROR);
      } else if (result.trackedOrder) {
        setTrackedOrder(result.trackedOrder);
        setTrackingMessage('Order verified.');
      } else {
        setTrackingMessage(TRACK_ERROR);
      }
    } catch {
      setTrackingMessage('We could not verify that order right now. Please try again later.');
    } finally {
      setTracking(false);
    }
  }

  const visibleOrders = trackedOrder
    ? [
        trackedOrder,
        ...orders.filter((order) => order.orderNumber !== trackedOrder.orderNumber),
      ]
    : orders;

  return (
    <>
      <div className="my-orders-track">
        <h2>Track an order</h2>
        <p>Enter the order number and phone number used at checkout.</p>
        <form className="my-orders-track-form" onSubmit={handleTrackOrder}>
          <label>
            <span>Order number</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="e.g. 1042"
              required
            />
          </label>
          <label>
            <span>Phone number</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+92 3XX XXXXXXX"
              required
            />
          </label>
          <button className="button button-gold bg-gradient-gold" type="submit" disabled={tracking}>
            {tracking ? 'Checking…' : 'Track order'}
          </button>
        </form>
        {trackingMessage && (
          <p className="my-orders-track-message" role="status" aria-live="polite">
            {trackingMessage}
          </p>
        )}
      </div>

      {loading ? (
        <div className="my-orders-loading">
          <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></span>
          <p>Loading your orders…</p>
        </div>
      ) : loadError ? (
        <div className="my-orders-empty reveal">
          <h2>Orders unavailable</h2>
          <p>{loadError}</p>
          <button className="button button-outline" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="my-orders-empty reveal">
          <div className="my-orders-empty-icon">📦</div>
          <h2>No saved orders</h2>
          <p>Orders placed from this browser will appear here. You can also track an order above.</p>
          <a className="button button-gold bg-gradient-gold" href="/products">
            Browse Products <span aria-hidden="true">↗</span>
          </a>
        </div>
      ) : (
        <div className="my-orders-list">
          {visibleOrders.map((order) => (
            <OrderCard key={order.orderNumber} order={order} />
          ))}
        </div>
      )}
    </>
  );
}

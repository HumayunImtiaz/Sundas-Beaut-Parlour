'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';

type SavedOrder = {
  orderId: string;
  phone: string;
  details?: Order;
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

const LS_ORDER_IDS_KEY = 'sundas_order_ids';
const LS_IDENTITY_KEY = 'sundas_customer_identity';

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
        const details = 'details' in entry ? entry.details : undefined;
        return [{
          orderId: entry.orderId,
          phone: entry.phone,
          ...(isOrder(details) ? { details } : {}),
        }];
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

function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== 'object') return false;
  const order = value as Partial<Order>;
  return (
    Number.isSafeInteger(order.orderNumber) &&
    Array.isArray(order.items) &&
    order.items.every(isOrderItem) &&
    typeof order.total === 'number' &&
    (order.date === null || typeof order.date === 'string') &&
    order.paymentMethod === 'Cash on Delivery' &&
    (order.status === 'Pending' || order.status === 'Confirmed' || order.status === 'Delivered')
  );
}

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<OrderItem>;
  return (
    typeof item.name === 'string' &&
    (item.thumbnail === null || typeof item.thumbnail === 'string') &&
    Number.isFinite(item.quantity) &&
    Number.isFinite(item.price)
  );
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
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [trackingMessage, setTrackingMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedOrders = getSavedOrders();
    setOrders(savedOrders.flatMap((saved) => saved.details ? [saved.details] : []));
    setLoading(false);
  }, []);

  function handleTrackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTrackedOrder(null);
    setTrackingMessage(null);
    const saved = getSavedOrders().find((entry) =>
      entry.details?.orderNumber === Number(orderNumber.replace(/^#/, '').trim()) &&
      entry.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
    if (saved?.details) {
      setTrackedOrder(saved.details);
      setTrackingMessage('Order found on this browser.');
    } else {
      setTrackingMessage('Order not found on this browser. Check the order number and phone, or contact us on WhatsApp.');
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
        <p>Orders are saved only in this browser. For order updates, contact us on WhatsApp.</p>
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
          <button className="button button-gold bg-gradient-gold" type="submit">Track order</button>
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

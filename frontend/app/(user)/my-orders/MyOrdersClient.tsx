'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderItem = {
  id: string;
  title?: string;
  product_title?: string;
  variant_title?: string;
  quantity: number;
  unit_price?: number;
  thumbnail?: string | null;
  variant?: { product?: { title?: string; thumbnail?: string | null } };
  product?: { title?: string; thumbnail?: string | null };
};

type Order = {
  id: string;
  display_id?: number;
  created_at?: string;
  subtotal?: number;
  total?: number;
  fulfillment_status?: string;
  payment_status?: string;
  payment_collections?: { payment_status?: string; payment_provider_id?: string }[];
  metadata?: { delivery_status?: string; [key: string]: unknown };
  items?: OrderItem[];
};

type CustomerIdentity = { email: string; phone?: string } | null;

// ─── Status mapping ──────────────────────────────────────────────────────────

type StatusBadge = { label: string; className: string };

function mapDeliveryStatus(order: Order): StatusBadge {
  const status = order.metadata?.delivery_status;
  switch (status) {
    case 'confirmed': return { label: '✅ Confirmed', className: 'order-status-confirmed' };
    case 'delivered': return { label: '📦 Delivered', className: 'order-status-delivered' };
    default:          return { label: '⏳ Pending',   className: 'order-status-pending' };
  }
}

function mapPaymentStatus(order: Order): string {
  const providerId = order.payment_collections?.[0]?.payment_provider_id;
  return providerId === 'pp_system_default'
    ? 'Cash on Delivery'
    : 'Online Payment';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LS_IDENTITY_KEY = 'sundas_customer_identity';

function getIdentity(): CustomerIdentity {
  try {
    const raw = localStorage.getItem(LS_IDENTITY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerIdentity;
  } catch {
    return null;
  }
}

function itemName(item: OrderItem): string {
  return (
    item.product_title
    ?? item.variant?.product?.title
    ?? item.product?.title
    ?? item.title
    ?? 'Product'
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MyOrdersClient() {
  const [identity, setIdentity] = useState<CustomerIdentity>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getIdentity();
    setIdentity(id);

    if (!id?.email) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(id.email)}`, {
          cache: 'no-store'
        });
        const data = await res.json() as { orders?: Order[]; error?: string };
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data.orders ?? []);
        }
      } catch {
        setError('Could not load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="my-orders-loading">
        <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></span>
        <p>Loading your orders…</p>
      </div>
    );
  }

  // ─── No identity stored ────────────────────────────────────────────────────

  if (!identity?.email) {
    return (
      <div className="my-orders-empty reveal">
        <div className="my-orders-empty-icon">📦</div>
        <h2>No orders found</h2>
        <p>
          You haven&apos;t placed any orders from this device yet, or your session has been cleared.
          Orders are tracked using the email you enter at checkout.
        </p>
        <a className="button button-gold bg-gradient-gold" href="/products">
          Browse Products <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  // ─── No orders for this email ──────────────────────────────────────────────

  if (!error && orders.length === 0) {
    return (
      <div className="my-orders-empty reveal">
        <div className="my-orders-empty-icon">🛍️</div>
        <h2>You haven&apos;t placed any orders yet</h2>
        <p>
          No orders found for <strong style={{ color: 'var(--color-gold-light)' }}>{identity.email}</strong>.
          Once you place an order it will appear here.
        </p>
        <a className="button button-gold bg-gradient-gold" href="/products">
          Start Shopping <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="my-orders-empty reveal">
        <div className="my-orders-empty-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button
          className="button button-outline"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ─── Orders list ──────────────────────────────────────────────────────────

  return (
    <div className="my-orders-list">
      <p className="my-orders-identity">
        Showing orders for <strong>{identity.email}</strong>
        {identity.phone && <> · {identity.phone}</>}
      </p>

      {orders.map(order => {
        const fulfillBadge = mapDeliveryStatus(order);
        const paymentLabel = mapPaymentStatus(order);
        const total = order.total ?? order.subtotal ?? 0;

        return (
          <div key={order.id} className="order-card reveal">
            {/* ── Card header ── */}
            <div className="order-card-header">
              <div>
                <p className="eyebrow" style={{ marginBottom: '6px' }}>
                  Order {order.display_id ? `#${order.display_id}` : ''}
                </p>
                <p className="order-card-date">{formatDate(order.created_at)}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span className={`order-status-badge ${fulfillBadge.className}`}>
                  {fulfillBadge.label}
                </span>
                <span className="order-payment-badge">{paymentLabel}</span>
              </div>
            </div>

            {/* ── Items ── */}
            <div className="order-items">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="order-item-row">
                  <div className="order-item-info">
                    <span className="order-item-name">{itemName(item)}</span>
                    {item.variant_title && item.variant_title !== 'Default Variant' && (
                      <span className="order-item-variant">{item.variant_title}</span>
                    )}
                  </div>
                  <div className="order-item-right">
                    <span className="order-item-qty">× {item.quantity}</span>
                    <span className="order-item-price">
                      PKR {((item.unit_price ?? 0) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="order-card-footer">
              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                {(order.items ?? []).reduce((s, i) => s + i.quantity, 0)} item(s)
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Total</span>
                <strong className="order-total">PKR {total.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

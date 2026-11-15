'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getWhatsAppLink } from '@/lib/site';
import { useCart, type CartData } from '../../providers/CartProvider';

type CheckoutValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
};

type OrderDetails = {
  orderNumber: number;
  date: string;
  items: { name: string; thumbnail: string | null; quantity: number; price: number }[];
  total: number;
  paymentMethod: 'Cash on Delivery';
  status: 'Pending';
};

const ORDER_STORAGE_KEY = 'sundas_order_ids';

function saveOrder(orderNumber: number, phone: string, details: OrderDetails) {
  let existing: unknown[] = [];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) ?? '[]');
    if (Array.isArray(saved)) existing = saved;
  } catch (error) {
    console.warn('[checkout] Existing saved orders were not valid JSON.', error);
  }

  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([
      { orderId: String(orderNumber), phone, details },
      ...existing.filter((entry) =>
        !entry || typeof entry !== 'object' || !('orderId' in entry) || entry.orderId !== String(orderNumber)
      )
    ]));
  } catch (error) {
    console.warn('[checkout] Could not save the order in this browser.', error);
  }
}

function createOrderMessage(cart: CartData, values: CheckoutValues, orderNumber: number): string {
  const origin = window.location.origin;
  const itemLines = cart.items.map((item, index) => {
    const name = item.product_title ?? item.title ?? 'Product';
    const quantity = item.quantity;
    const price = item.unit_price ?? 0;
    const productLink = item.product_slug
      ? `${origin}/products/${encodeURIComponent(item.product_slug)}`
      : null;
    const image = item.thumbnail
      ? (item.thumbnail.startsWith('/') ? `${origin}${item.thumbnail}` : item.thumbnail)
      : null;
    return [
      `${index + 1}. *${name}*`,
      `   ${quantity} × PKR ${price.toLocaleString('en-PK')} = PKR ${(quantity * price).toLocaleString('en-PK')}`,
      image ? `   Image: ${image}` : null,
      productLink ? `   Product/image details: ${productLink}` : null
    ].filter(Boolean).join('\n');
  });
  const customerName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();

  return [
    '*NEW ORDER — SUNDAS BEAUTY PARLOUR*',
    `Order No: #${orderNumber}`,
    `Date: ${new Date().toLocaleString('en-PK')}`,
    '',
    '*CUSTOMER DETAILS*',
    `Name: ${customerName}`,
    `Phone: ${values.phone.trim()}`,
    values.email.trim() ? `Email: ${values.email.trim()}` : null,
    `Address: ${values.address.trim()}, ${values.city.trim()}${values.postalCode.trim() ? `, ${values.postalCode.trim()}` : ''}`,
    '',
    '*ORDER ITEMS*',
    ...itemLines,
    '',
    `*TOTAL: PKR ${cart.subtotal.toLocaleString('en-PK')}*`,
    'Payment: Cash on Delivery'
  ].filter((line): line is string => line !== null).join('\n');
}

export function CheckoutForm({ cart }: { cart: CartData }) {
  const { setCart } = useCart();
  const [values, setValues] = useState<CheckoutValues>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [error, setError] = useState('');
  const [order, setOrder] = useState<{ orderNumber: number; whatsappUrl: string } | null>(null);

  function updateValue(field: keyof CheckoutValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim() || !values.phone.trim() ||
      !values.address.trim() || !values.city.trim()) {
      setError('Please enter your name, phone number, and delivery address.');
      return;
    }
    if (!/^\+?[\d\s\-()]{7,20}$/.test(values.phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const orderNumber = Date.now();
    const whatsappUrl = getWhatsAppLink(createOrderMessage(cart, values, orderNumber));
    setOrder({ orderNumber, whatsappUrl });
  }

  function handleOpenWhatsApp() {
    if (!order) return;
    saveOrder(order.orderNumber, values.phone.trim(), {
      orderNumber: order.orderNumber,
      date: new Date().toISOString(),
      items: cart.items.map((item) => ({
        name: item.product_title ?? item.title ?? 'Product',
        thumbnail: item.thumbnail ?? null,
        quantity: item.quantity,
        price: item.unit_price ?? 0
      })),
      total: cart.subtotal,
      paymentMethod: 'Cash on Delivery',
      status: 'Pending'
    });
    setCart(null);
  }

  if (order) {
    return (
      <div className="order-success reveal">
        <span aria-hidden="true">✔</span>
        <h2>Order #{order.orderNumber} is ready.</h2>
        <p>Send the order details to Sundas Beauty Parlour on WhatsApp to confirm your order.</p>
        <div style={{ marginTop: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <a className="button button-gold bg-gradient-gold" href={order.whatsappUrl} target="_blank" rel="noreferrer" onClick={handleOpenWhatsApp}>
            Send order on WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <Link className="button button-outline" href="/products">Continue Shopping <span aria-hidden="true">↗</span></Link>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '12px', marginTop: '20px' }}>
          WhatsApp opens with your order details. Tap Send there to place the order.
        </p>
      </div>
    );
  }

  function renderInput(field: keyof CheckoutValues, label: string, type = 'text', placeholder?: string) {
    const required = ['firstName', 'lastName', 'phone', 'address', 'city'].includes(field);
    return (
      <label>
        {label}{required && <span className="field-required"> *</span>}
        <input
          type={type}
          value={values[field]}
          onChange={(event) => updateValue(field, event.target.value)}
          placeholder={placeholder}
          required={required}
        />
      </label>
    );
  }

  return (
    <div className="cart-layout relative">
      <form id="checkout-form" onSubmit={handleSubmit} className="checkout-fields">
        <div className="order-form-panel">
          <div className="order-form-heading"><h2>Contact</h2><p>We will use these details for your order.</p></div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            {renderInput('phone', 'Phone number', 'tel', '+92 3XX XXXXXXX')}
            {renderInput('email', 'Email address (optional)', 'email', 'your@email.com')}
          </div>
        </div>

        <div className="order-form-panel">
          <div className="order-form-heading"><h2>Delivery address</h2><p>Where should we send your order?</p></div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              {renderInput('firstName', 'First name')}
              {renderInput('lastName', 'Last name')}
            </div>
            <label>
              Address<span className="field-required"> *</span>
              <textarea rows={2} value={values.address} onChange={(event) => updateValue('address', event.target.value)} placeholder="Street address, apartment, suite, etc." required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
              {renderInput('city', 'City')}
              {renderInput('postalCode', 'Postal code (optional)')}
            </div>
          </div>
        </div>

        <div className="order-form-panel">
          <div className="order-form-heading"><h2>Payment mode</h2><p>Payment is collected when your order arrives.</p></div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <div className="payment-label"><span>Selected method</span><strong>Cash on Delivery (COD)</strong></div>
          </div>
        </div>
      </form>

      <aside className="cart-summary relative" style={{ alignSelf: 'start' }}>
        <p className="eyebrow">Order summary</p>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {cart.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="cart-item-image" style={{ flex: '0 0 48px', width: '48px', height: '48px', position: 'relative', overflow: 'hidden' }}>
                {item.thumbnail && <Image src={item.thumbnail} alt={item.product_title ?? item.title ?? 'Product'} fill sizes="48px" unoptimized style={{ objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: '1', minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-light)' }}>{item.product_title ?? item.title}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--color-text-light)' }}>
                PKR {((item.unit_price ?? 0) * item.quantity).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', margin: '18px 0', paddingTop: '18px' }}>
          <div><span>Delivery</span><strong>Confirmed on WhatsApp</strong></div>
        </div>
        <div style={{ borderTop: '1px solid var(--color-gold)', paddingTop: '18px', marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>Total</span>
          <strong style={{ fontSize: '24px' }}>PKR {cart.subtotal.toLocaleString()}</strong>
        </div>
        {error && <p className="cart-error" role="alert" style={{ marginBottom: '16px' }}>{error}</p>}
        <button className="button button-gold bg-gradient-gold" type="submit" form="checkout-form" style={{ width: '100%', justifyContent: 'center' }}>
          Prepare WhatsApp Order <span aria-hidden="true">↗</span>
        </button>
      </aside>
    </div>
  );
}

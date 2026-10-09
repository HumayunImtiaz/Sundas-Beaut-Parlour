'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notifyCartUpdated } from '@/lib/cart-events';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartProduct = {
  thumbnail?: string | null;
  title?: string;
};

type CartItem = {
  id: string;
  title?: string;
  product_title?: string;
  variant_title?: string;
  thumbnail?: string | null;
  variant?: { product?: CartProduct };
  product?: CartProduct;
  variant_id: string;
  quantity: number;
  unit_price?: number;
};

type Cart = {
  items?: CartItem[];
  subtotal?: number;
};

// ─── Field keys & validation ──────────────────────────────────────────────────

const FIELD_KEYS = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone', 'email'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

type FieldMeta = {
  label: string;
  required: boolean;
  pattern?: RegExp;
  patternMsg?: string;
};

const FIELDS: Record<FieldKey, FieldMeta> = {
  firstName:  { label: 'First name',    required: true },
  lastName:   { label: 'Last name',     required: true },
  address:    { label: 'Address',       required: true },
  city:       { label: 'City',          required: true },
  postalCode: { label: 'Postal code',   required: true },
  phone:      { label: 'Phone number',  required: true,  pattern: /^\+?[\d\s\-()]{7,20}$/, patternMsg: 'Enter a valid phone number' },
  email:      { label: 'Email address', required: true,  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email address' },
};

type FormValues = Record<FieldKey, string>;
type FormErrors = Partial<Record<FieldKey, string>>;

const emptyValues = (): FormValues =>
  Object.fromEntries(FIELD_KEYS.map(k => [k, ''])) as FormValues;

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_IDENTITY_KEY = 'sundas_customer_identity';
const LS_ORDER_IDS_KEY = 'sundas_order_ids';

function saveIdentity(email: string, phone: string) {
  try {
    localStorage.setItem(LS_IDENTITY_KEY, JSON.stringify({ email, phone }));
  } catch { /* ignore */ }
}

function saveOrderId(orderId: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(LS_ORDER_IDS_KEY) ?? '[]');
    if (!existing.includes(orderId)) {
      localStorage.setItem(LS_ORDER_IDS_KEY, JSON.stringify([...existing, orderId]));
    }
  } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutForm({ cart }: { cart: Cart }) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [displayId, setDisplayId] = useState<number | null>(null);

  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function onChange(key: FieldKey, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (submitError) setSubmitError(null);
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    for (const key of FIELD_KEYS) {
      const meta = FIELDS[key];
      const val = values[key].trim();
      if (meta.required && !val) {
        errs[key] = 'This field is required';
      } else if (val && meta.pattern && !meta.pattern.test(val)) {
        errs[key] = meta.patternMsg ?? 'Invalid format';
      }
    }
    return errs;
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const errs = validate();
    setErrors(errs);

    const firstBadKey = FIELD_KEYS.find(k => errs[k]);
    if (firstBadKey) {
      const el = fieldRefs.current[firstBadKey];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      // 1. Complete the Medusa cart → place the real order
      //    Send all customer/address details so the API can update the cart
      //    with email, shipping address, billing address, shipping method,
      //    and payment session before calling cart.complete().
      const completeRes = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email.trim(),
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          address: values.address.trim(),
          city: values.city.trim(),
          postalCode: values.postalCode.trim(),
          phone: values.phone.trim(),
        }),
      });
      const completeData = await completeRes.json() as { order?: { id: string; display_id?: number }; error?: string };

      if (!completeRes.ok || completeData.error) {
        setSubmitError(completeData.error ?? 'Order could not be placed. Please try again.');
        setLoading(false);
        return;
      }

      const order = completeData.order!;

      // 2. Clear the cart cookie so the navbar resets
      await fetch('/api/cart/clear', { method: 'DELETE' });

      // 3. Notify the navbar to reset badge to 0
      notifyCartUpdated({ itemCount: 0 });

      // 4. Persist identity + order ID for /my-orders
      saveIdentity(values.email.trim(), values.phone.trim());
      saveOrderId(order.id);

      // 5. Show success screen
      setOrderId(order.id);
      setDisplayId(order.display_id ?? null);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="order-success reveal">
        <span aria-hidden="true">✔</span>
        <h2>Order Confirmed.</h2>
        {displayId && (
          <p style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)', fontSize: '13px', marginBottom: '4px' }}>
            Order #{displayId}
          </p>
        )}
        <p>Thank you for shopping with Sundas Beauty Parlour. We will process your order soon.</p>
        <div style={{ marginTop: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link className="button button-gold bg-gradient-gold" href="/my-orders">
            Track My Order <span aria-hidden="true">→</span>
          </Link>
          <Link className="button button-outline" href="/products">
            Continue Shopping <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {orderId && (
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '11px', marginTop: '20px' }}>
            Order ID: <code style={{ color: 'var(--color-gold-light)' }}>{orderId}</code>
          </p>
        )}
      </div>
    );
  }

  // ─── Reusable field renderer ────────────────────────────────────────────────

  function renderInput(key: FieldKey, type: 'text' | 'email' | 'tel' = 'text', placeholder?: string) {
    const meta = FIELDS[key];
    const hasError = Boolean(errors[key]);
    return (
      <label>
        {meta.label}{meta.required && <span className="field-required"> *</span>}
        <input
          ref={el => { fieldRefs.current[key] = el; }}
          type={type}
          value={values[key]}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `err-${key}` : undefined}
        />
        {hasError && <small id={`err-${key}`} role="alert">{errors[key]}</small>}
      </label>
    );
  }

  function renderTextarea(key: FieldKey, rows: number, placeholder?: string) {
    const meta = FIELDS[key];
    const hasError = Boolean(errors[key]);
    return (
      <label>
        {meta.label}{meta.required && <span className="field-required"> *</span>}
        <textarea
          ref={el => { fieldRefs.current[key] = el; }}
          rows={rows}
          value={values[key]}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `err-${key}` : undefined}
        />
        {hasError && <small id={`err-${key}`} role="alert">{errors[key]}</small>}
      </label>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="cart-layout relative">
      <form onSubmit={handleSubmit} className="checkout-fields" noValidate>
        <div className="order-form-panel">
          <div className="order-form-heading">
            <h2>Contact</h2>
            <p>Will be used for order updates</p>
          </div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            {renderInput('email', 'email', 'your@email.com')}
            {renderInput('phone', 'tel', '+92 3XX XXXXXXX')}
          </div>
        </div>

        <div className="order-form-panel">
          <div className="order-form-heading">
            <h2>Shipping Area</h2>
            <p>Where should we send your order?</p>
          </div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              {renderInput('firstName', 'text', 'First name')}
              {renderInput('lastName', 'text', 'Last name')}
            </div>
            {renderTextarea('address', 2, 'Street address, apartment, suite, etc.')}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
              {renderInput('city', 'text', 'City')}
              {renderInput('postalCode', 'text', 'Postal code')}
            </div>
          </div>
        </div>

        <div className="order-form-panel">
          <div className="order-form-heading">
            <h2>Payment Mode</h2>
            <p>All transactions are secure and encrypted.</p>
          </div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <div className="payment-label">
              <span>Selected Method</span>
              <strong>Cash on Delivery (COD)</strong>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: '4px 0 0 12px' }}>
              Pay with cash upon delivery.
            </p>
          </div>
        </div>
      </form>

      <aside className="cart-summary relative" style={{ alignSelf: 'start' }}>
        <p className="eyebrow">Order Summary</p>
        
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {cart.items?.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div className="cart-item-image" style={{ flex: '0 0 48px', width: '48px', height: '48px', position: 'relative', overflow: 'hidden' }}>
                 {(item.thumbnail || item.variant?.product?.thumbnail || item.product?.thumbnail) && (
                   <Image 
                     src={(item.thumbnail || item.variant?.product?.thumbnail || item.product?.thumbnail) as string} 
                     alt={item.product_title || item.title || 'Product'} 
                     fill 
                     sizes="48px"
                     style={{ objectFit: 'cover' }}
                     unoptimized
                   />
                 )}
               </div>
               <div style={{ flex: '1', minWidth: 0 }}>
                 <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {item.product_title || item.title}
                 </p>
                 <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                   Qty: {item.quantity}
                 </p>
               </div>
               <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--color-text-light)' }}>
                 PKR {((item.unit_price || 0) * item.quantity).toLocaleString()}
               </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', margin: '18px 0', paddingTop: '18px' }}>
          <div>
            <span>Subtotal</span>
            <strong>PKR {(cart.subtotal ?? 0).toLocaleString()}</strong>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span>Shipping</span>
            <strong>Calculated at next step</strong>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid var(--color-gold)', paddingTop: '18px', marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>Total</span>
          <strong style={{ fontSize: '24px' }}>PKR {(cart.subtotal ?? 0).toLocaleString()}</strong>
        </div>

        {submitError && (
          <p className="cart-error" role="alert" style={{ marginBottom: '16px' }}>{submitError}</p>
        )}

        <button 
          className="button button-gold bg-gradient-gold" 
          type="button" 
          onClick={() => void handleSubmit()} 
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            <>Complete Order <span aria-hidden="true">✔</span></>
          )}
        </button>
      </aside>
    </div>
  );
}

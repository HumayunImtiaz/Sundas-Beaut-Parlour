'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

export function CheckoutForm({ cart }: { cart: Cart }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate order placement
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="order-success reveal">
        <span aria-hidden="true">✔</span>
        <h2>Order Confirmed.</h2>
        <p>Thank you for shopping with Sundas Beauty Parlour. We will process your order soon.</p>
        <div style={{ marginTop: '30px' }}>
          <Link className="button button-outline" href="/products">Continue Shopping <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-layout relative">
      <form onSubmit={handleSubmit} className="checkout-fields">
        <div className="order-form-panel">
          <div className="order-form-heading">
            <h2>Contact</h2>
            <p>Will be used for order updates</p>
          </div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <label>
              Email address
              <input type="email" required placeholder="your@email.com" />
            </label>
            <label>
              Phone number
              <input type="tel" required placeholder="+92 3XX XXXXXXX" />
            </label>
          </div>
        </div>

        <div className="order-form-panel">
          <div className="order-form-heading">
            <h2>Shipping Area</h2>
            <p>Where should we send your order?</p>
          </div>
          <div className="order-form" style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <label>
                First name
                <input type="text" required placeholder="First name" />
              </label>
              <label>
                Last name
                <input type="text" required placeholder="Last name" />
              </label>
            </div>
            <label>
              Address
              <textarea required rows={2} placeholder="Street address, apartment, suite, etc." />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
               <label>
                 City
                 <input type="text" required placeholder="City" />
               </label>
               <label>
                 Postal code
                 <input type="text" placeholder="Postal code" />
               </label>
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

        <button 
          className="button button-gold bg-gradient-gold" 
          type="button" 
          onClick={handleSubmit} 
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

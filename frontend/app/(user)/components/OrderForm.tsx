'use client';

import { FormEvent, useState } from 'react';
import { getWhatsAppLink } from '@/lib/site';

type OrderFormProps = {
  productName: string;
  quantity: number;
};

type FormErrors = Partial<Record<'name' | 'phone' | 'address', string>>;

export function OrderForm({ productName, quantity }: OrderFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleOrderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors: FormErrors = {};
    if (!String(formData.get('name')).trim()) nextErrors.name = 'Please enter your full name.';
    if (!String(formData.get('phone')).trim()) nextErrors.phone = 'Please enter your phone number.';
    if (!String(formData.get('address')).trim()) nextErrors.address = 'Please enter your delivery address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const message = `Hello Sundas Beauty Parlour, I would like to order ${quantity} x ${productName}.\nName: ${formData.get('name')}\nPhone: ${formData.get('phone')}\nAddress: ${formData.get('address')}\nNotes: ${formData.get('notes') || 'None'}`;
    window.open(getWhatsAppLink(message), '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  }

  if (submitted) return <div className="order-success" role="status"><span aria-hidden="true">✦</span><h2>Order received!</h2><p>We&apos;ll contact you shortly to confirm.</p></div>;

  return (
    <form className="order-form" onSubmit={handleOrderSubmit} noValidate>
      <div className="order-form-heading"><p className="eyebrow">Cash on delivery</p><h2>Complete your order.</h2><p>Ordering: <strong>{productName}</strong> · {quantity}</p></div>
      <label>Full Name<input name="name" type="text" autoComplete="name" aria-invalid={Boolean(errors.name)} />{errors.name && <small>{errors.name}</small>}</label>
      <label>Phone Number<input name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />{errors.phone && <small>{errors.phone}</small>}</label>
      <label>Delivery Address<textarea name="address" rows={3} autoComplete="street-address" aria-invalid={Boolean(errors.address)} />{errors.address && <small>{errors.address}</small>}</label>
      <label>Quantity<input name="quantity" type="number" value={quantity} readOnly /></label>
      <label>Notes <span>(optional)</span><textarea name="notes" rows={2} /></label>
      <div className="payment-label"><span>Payment method</span><strong>Cash on Delivery</strong></div>
      <button className="button button-gold bg-gradient-gold" type="submit">Send Order on WhatsApp <span aria-hidden="true">↗</span></button>
    </form>
  );
}

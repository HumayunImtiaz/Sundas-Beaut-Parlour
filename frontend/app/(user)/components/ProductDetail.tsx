'use client';

import { useState } from 'react';
import { OrderForm } from './OrderForm';

type ProductDetailProps = { productName: string };

export function ProductDetailOrder({ productName }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);

  return <>
    <div className="quantity-control" aria-label="Quantity selector"><span>Quantity</span><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((current) => current + 1)} aria-label="Increase quantity">+</button></div>
    <button className="button button-gold bg-gradient-gold" type="button" onClick={() => setShowForm(true)}>Order Now (Cash on Delivery) <span aria-hidden="true">↗</span></button>
    {showForm && <div className="order-form-panel"><OrderForm productName={productName} quantity={quantity} /></div>}
  </>;
}

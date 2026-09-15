'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/content';

type NewProductToastProps = {
  product?: Product;
};

export function NewProductToast({ product }: NewProductToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!product) return;
    const showTimer = window.setTimeout(() => setVisible(true), 2000);
    const hideTimer = window.setTimeout(() => setVisible(false), 7000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [product]);

  if (!product || !visible) return null;

  return (
    <aside className="new-product-toast bg-gradient-gold" role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">✦</span>
      <div><p className="toast-label">New product</p><Link href={`/products/${product.slug}`}>{product.name} is now available <span aria-hidden="true">↗</span></Link></div>
      <button type="button" className="toast-close" onClick={() => setVisible(false)} aria-label="Close notification">×</button>
    </aside>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CartPageClient } from './CartPageClient';

export const metadata: Metadata = {
  title: 'Your Cart | Sundas Beauty Parlour',
  description: 'Review your Sundas Beauty Parlour products before checkout.'
};

export default function CartPage() {
  return (
    <main className="products-page cart-page">
      <Navbar />
      <section className="products-header section-shell">
        <Link className="back-link" href="/products">← Continue shopping</Link>
        <p className="eyebrow">Your ritual</p>
        <h1>Your<br /><em>cart.</em></h1>
        <p className="section-intro">Review your selected essentials before checkout.</p>
      </section>
      <section className="cart-content section-shell">
        <CartPageClient />
      </section>
      <WhatsAppButton />
    </main>
  );
}
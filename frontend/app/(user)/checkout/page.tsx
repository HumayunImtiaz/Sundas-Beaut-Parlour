import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CheckoutPageClient } from './CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Secure Checkout | Sundas Beauty Parlour',
  description: 'Complete your order securely.'
};

export default function CheckoutPage() {
  return (
    <main className="products-page">
      <Navbar />
      <section className="products-header section-shell">
        <Link className="back-link" href="/cart">← Back to Cart</Link>
        <p className="eyebrow">Final Step</p>
        <h1>Secure<br /><em>checkout.</em></h1>
        <p className="section-intro">Please complete your details to finalize your orders.</p>
      </section>

      <section className="cart-content section-shell">
        <CheckoutPageClient />
      </section>
      <WhatsAppButton />
    </main>
  );
}

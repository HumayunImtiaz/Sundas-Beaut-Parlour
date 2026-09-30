import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Navbar } from '../components/Navbar';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { getMedusaCart } from '@/lib/medusa';
import { CheckoutForm } from './CheckoutForm';

export const metadata: Metadata = {
  title: 'Secure Checkout | Sundas Beauty Parlour',
  description: 'Complete your order securely.'
};

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const cart = await getMedusaCart();

  if (!cart || !cart.items || cart.items.length === 0) {
    redirect('/cart');
  }

  return (
    <main className="products-page">
      <Navbar />
      <section className="products-header section-shell">
        <Link className="back-link" href="/cart">← Back to Cart</Link>
        <p className="eyebrow">Final Step</p>
        <h1>Secure<br /><em>checkout.</em></h1>
        <p className="section-intro">Complete your details to finalize your order.</p>
      </section>
      
      <section className="cart-content section-shell">
        <CheckoutForm cart={cart} />
      </section>
      <WhatsAppButton />
    </main>
  );
}

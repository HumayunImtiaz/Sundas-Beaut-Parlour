import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { getMedusaCart } from '@/lib/medusa';
import { CartItems } from './CartItems';

export const metadata: Metadata = {
  title: 'Your Cart | Sundas Beauty Parlour',
  description: 'Review your Sundas Beauty Parlour products before checkout.'
};

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const cart = await getMedusaCart();

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
        {cart?.items?.length ? <CartItems cart={cart} /> : <div className="cart-empty"><p>Your cart is waiting for something lovely.</p><Link className="button button-outline" href="/products">Browse products <span aria-hidden="true">↗</span></Link></div>}
      </section>
      <WhatsAppButton />
    </main>
  );
}
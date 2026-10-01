import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { MyOrdersClient } from './MyOrdersClient';

export const metadata: Metadata = {
  title: 'My Orders | Sundas Beauty Parlour',
  description: 'Track your orders from Sundas Beauty Parlour.'
};

export default function MyOrdersPage() {
  return (
    <main className="products-page">
      <Navbar />
      <section className="products-header section-shell">
        <p className="eyebrow">Order History</p>
        <h1>My <em>Orders.</em></h1>
        <p className="section-intro">
          Track the status of all orders placed from this device.
        </p>
      </section>

      <section className="my-orders-section section-shell">
        <MyOrdersClient />
      </section>

      <WhatsAppButton />
    </main>
  );
}

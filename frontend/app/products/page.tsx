import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { homeRemedies } from '@/lib/homeRemedies';

export const metadata: Metadata = {
  title: 'Products | Sundas Beauty Parlour',
  description: 'Shop trusted beauty essentials from Sundas Beauty Parlour.'
};

export default function ProductsPage() {
  return (
    <main className="products-page">
      <Navbar />
      <section className="products-header section-shell">
        <Link className="back-link" href="/#products">← Back to home</Link>
        <p className="eyebrow">Take the ritual home</p>
        <h1>Beauty,<br /><em>at home.</em></h1>
        <p className="section-intro">Explore our collection of trusted beauty essentials, selected with the same care as every salon ritual.</p>
      </section>
      <section className="products-list section-shell">
        <div className="service-grid">{homeRemedies.map((product, index) => <ProductCard product={product} index={index} key={product.slug} />)}</div>
      </section>
      <WhatsAppButton />
    </main>
  );
}

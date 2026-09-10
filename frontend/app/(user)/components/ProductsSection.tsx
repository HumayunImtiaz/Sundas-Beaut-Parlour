import Link from 'next/link';
import type { Product } from '@/lib/content';
import { ProductCard } from './ProductCard';

export function ProductsSection({ products }: { products: Product[] }) {
  return (
    <section className="products-section section-shell" id="products">
      <div className="section-heading reveal"><div><p className="eyebrow">Take the ritual home</p><h2>Our<br /><em>products.</em></h2></div><p className="section-intro">A small collection of trusted beauty essentials, selected to extend your salon ritual at home.</p></div>
      <div className="service-grid">{products.map((product, index) => <ProductCard product={product} index={index} key={product._id} />)}</div>
      <div className="services-more"><Link className="button button-outline" href="/products">View More <span aria-hidden="true">↗</span></Link></div>
    </section>
  );
}

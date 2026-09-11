import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { ProductDetailOrder } from '../../components/ProductDetail';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import { getProduct, products } from '@/lib/content';

type ProductPageProps = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProduct(params.slug);
  return { title: product ? `${product.name} | Sundas Beauty Parlour` : 'Product not found | Sundas Beauty Parlour' };
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <main className="product-detail-page">
      <Navbar />
      <section className="product-detail section-shell">
        <Link className="back-link" href="/products">← Back to all products</Link>
        <div className="product-detail-content">
          <div className="product-detail-image reveal">{product.image?.url ? <Image src={product.image.url} alt={product.name} fill unoptimized priority sizes="(max-width: 800px) 100vw, 55vw" /> : <div className="service-image" aria-hidden="true" />}</div>
          <div className="product-detail-copy reveal" style={{ '--delay': '120ms' } as React.CSSProperties}>
            <p className="eyebrow">Home remedy</p>
            <h1>{product.name}</h1>
            <p className="product-detail-description">{product.fullDescription}</p>
            <p className="product-detail-price">PKR {product.price.toLocaleString()}</p>
            <ProductDetailOrder productName={product.name} />
          </div>
        </div>
      </section>
      <WhatsAppButton />
    </main>
  );
}
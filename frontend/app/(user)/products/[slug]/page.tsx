import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { ProductDetailOrder } from '../../components/ProductDetail';
import { WhatsAppButton } from '../../components/WhatsAppButton';
import { ApiError, getProduct } from '@/lib/api';

type ProductPageProps = { params: { slug: string } };

// Products are managed by the admin panel, so dynamic rendering keeps this page in sync with MongoDB.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  let product;
  try { product = await getProduct(params.slug); } catch { product = null; }
  return { title: product ? `${product.name} | Sundas Beauty Parlour` : 'Product not found | Sundas Beauty Parlour' };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  let product;
  try { product = await getProduct(params.slug); } catch (error) { if (error instanceof ApiError && error.statusCode === 404) notFound(); throw error; }

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
            <ProductDetailOrder productId={product._id} productName={product.name} />
          </div>
        </div>
      </section>
      <WhatsAppButton />
    </main>
  );
}
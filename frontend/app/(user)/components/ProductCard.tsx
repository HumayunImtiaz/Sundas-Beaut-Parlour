import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/api';

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <article className="service-card reveal" style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}>
      <Link className="product-card-link" href={`/products/${product.slug}`} aria-label={`View details for ${product.name}`}>
        <div className="service-image-wrap">
          {product.image?.url ? <Image className="service-image" src={product.image.url} alt={product.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <div className="service-image" aria-hidden="true" />}
        </div>
        <div className="service-meta"><span>Product</span><span>PKR {product.price.toLocaleString()}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </Link>
      <Link href={`/products/${product.slug}`} className="service-link bg-gradient-gold">View Details <span aria-hidden="true">↗</span></Link>
    </article>
  );
}

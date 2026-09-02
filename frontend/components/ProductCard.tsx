import Image from 'next/image';
import Link from 'next/link';
import type { HomeRemedy } from '@/lib/homeRemedies';

type ProductCardProps = {
  product: HomeRemedy;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <article className="service-card reveal" style={{ '--delay': `${index * 90}ms` } as React.CSSProperties}>
      <Link className="product-card-link" href={`/products/${product.slug}`} aria-label={`View details for ${product.name}`}>
        <div className="service-image-wrap">
          <Image className="service-image" src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" />
        </div>
        <div className="service-meta"><span>Product</span><span>{product.price}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </Link>
      <Link href={`/products/${product.slug}`} className="service-link">View Details <span aria-hidden="true">↗</span></Link>
    </article>
  );
}

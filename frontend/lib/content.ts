export type ImageAsset = { url: string; publicId?: string };

export type Service = {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: ImageAsset;
  createdAt?: string;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription: string;
  price: number;
  image?: ImageAsset;
  stock: number;
  isNew: boolean;
  createdAt?: string;
};

export const services: Service[] = [
  { _id: 'service-hair-styling', name: 'Hair Styling', description: 'Personalised cuts, styling and finishing for your everyday glow.', price: 2500 },
  { _id: 'service-facial', name: 'Signature Facial', description: 'A restorative facial ritual for fresh, luminous skin.', price: 3500 },
  { _id: 'service-bridal', name: 'Bridal Beauty', description: 'Thoughtful hair and makeup for your most remembered moments.', price: 15000 }
];

export const products: Product[] = [
  { _id: 'product-hydrating-mask', name: 'Hydrating Hair Mask', slug: 'hydrating-hair-mask', description: 'A rich at-home treatment for soft, glossy hair.', fullDescription: 'Keep your salon finish going with this nourishing hydrating mask, selected for dry and tired hair.', price: 2800, stock: 10, isNew: true },
  { _id: 'product-glow-cleanser', name: 'Daily Glow Cleanser', slug: 'daily-glow-cleanser', description: 'A gentle cleanser for a calm, bright complexion.', fullDescription: 'A daily cleansing ritual that leaves skin feeling comfortable, clean and refreshed without stripping it.', price: 2200, stock: 10, isNew: false },
  { _id: 'product-silk-serum', name: 'Silk Finish Serum', slug: 'silk-finish-serum', description: 'Lightweight shine and smoothness for finished hair.', fullDescription: 'A few drops of this lightweight serum tame flyaways and leave hair with a soft, polished finish.', price: 2400, stock: 10, isNew: false }
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

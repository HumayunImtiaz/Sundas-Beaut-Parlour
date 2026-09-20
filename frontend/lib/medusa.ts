import Medusa from '@medusajs/js-sdk';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import type { Product, ProductVariant } from './content';

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'http://localhost:9000';
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
export const MEDUSA_CART_COOKIE = 'sundas_medusa_cart_id';

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey
});

type MedusaProduct = Awaited<ReturnType<typeof sdk.store.product.list>>['products'][number];
type MedusaPrice = { currency_code: string; amount: number };
type MedusaRegion = { id: string; currency_code: string };
type MedusaVariant = {
  id: string;
  title: string;
  options?: { value: string }[];
  prices?: MedusaPrice[];
  calculated_price?: { calculated_amount?: number };
};

function getVariantPrice(variant: MedusaVariant): number {
  const pkrPrice = variant.prices?.find((price) => price.currency_code === 'pkr')?.amount;
  return variant.calculated_price?.calculated_amount ?? pkrPrice ?? 0;
}

function mapVariants(product: MedusaProduct): ProductVariant[] {
  const variants = (product.variants as MedusaVariant[] | undefined) ?? [];
  return variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    options: variant.options?.map((option) => option.value) ?? [],
    price: getVariantPrice(variant)
  }));
}

function mapProduct(product: MedusaProduct): Product {
  const variant = product.variants?.[0];
  const variants = mapVariants(product);
  const calculatedPrice = variants[0]?.price ?? 0;

  return {
    _id: product.id,
    name: product.title,
    slug: product.handle,
    description: product.description ?? product.title,
    fullDescription: product.description ?? product.title,
    price: calculatedPrice,
    image: product.thumbnail ? { url: product.thumbnail } : undefined,
    stock: 0,
    isNew: Boolean(product.metadata?.is_new),
    variants
  };
}

const getPkrRegionId = unstable_cache(async (): Promise<string> => {
  const { regions } = await sdk.store.region.list();
  const pkrRegion = (regions as MedusaRegion[]).find((region) => region.currency_code === 'pkr');

  if (!pkrRegion) {
    throw new Error('No PKR region is configured in Medusa.');
  }

  return pkrRegion.id;
}, ['medusa-pkr-region'], { revalidate: 300 });

const productFields = '*variants,*variants.prices,*variants.calculated_price';
const cartFields = '*items';
const cartMutationFields = '*items';

const getCachedProducts = unstable_cache(async (): Promise<Product[]> => {
  const regionId = await getPkrRegionId();
  const { products } = await sdk.store.product.list({ limit: 100, region_id: regionId, fields: productFields });
  return products.map(mapProduct);
}, ['medusa-products'], { revalidate: 60 });

export async function getProducts(): Promise<Product[]> {
  return getCachedProducts();
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  const getCachedProduct = unstable_cache(async () => {
    const regionId = await getPkrRegionId();
    const { products } = await sdk.store.product.list({ handle, region_id: regionId, fields: productFields });
    return products[0] ? mapProduct(products[0]) : undefined;
  }, ['medusa-product', handle], { revalidate: 60 });
  return getCachedProduct();
}

export async function createMedusaCart() {
  const regionId = await getPkrRegionId();
  const { cart } = await sdk.store.cart.create({ region_id: regionId }, { fields: cartFields });
  cookies().set(MEDUSA_CART_COOKIE, cart.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  return cart;
}

function getMedusaCartId() {
  return cookies().get(MEDUSA_CART_COOKIE)?.value;
}

export async function getMedusaCart() {
  const cartId = getMedusaCartId();
  if (!cartId) return null;

  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, { fields: cartFields });
    return cart;
  } catch {
    cookies().delete(MEDUSA_CART_COOKIE);
    return null;
  }
}

export async function addMedusaLineItem(variantId: string, quantity: number) {
  const existingCartId = getMedusaCartId();
  const cartId = existingCartId ?? (await createMedusaCart()).id;

  const { cart: updatedCart } = await sdk.store.cart.createLineItem(cartId, { variant_id: variantId, quantity }, { fields: cartMutationFields });
  return updatedCart;
}

export async function updateMedusaLineItem(lineItemId: string, quantity: number) {
  const cartId = getMedusaCartId();
  if (!cartId) return null;

  const { cart: updatedCart } = await sdk.store.cart.updateLineItem(cartId, lineItemId, { quantity }, { fields: cartMutationFields });
  return updatedCart;
}

export async function removeMedusaLineItem(lineItemId: string) {
  const cartId = getMedusaCartId();
  if (!cartId) return null;

  const { parent } = await sdk.store.cart.deleteLineItem(cartId, lineItemId, { fields: cartMutationFields });
  return parent;
}
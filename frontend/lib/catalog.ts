import type { Product } from './content';
import { products as localProducts } from './content';
import { getSupabaseCatalogClient } from './supabase';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  full_description: string;
  price: number;
  stock: number;
  is_new: boolean;
  image_url: string | null;
};

function mapProduct(row: ProductRow): Product {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    fullDescription: row.full_description,
    price: Number(row.price),
    stock: Number(row.stock),
    isNew: row.is_new,
    image: row.image_url ? { url: row.image_url } : undefined
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabaseCatalogClient();
  if (!supabase) return localProducts;

  const { data, error } = await supabase
    .from('products')
    .select('id,name,slug,description,full_description,price,stock,is_new,image_url')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Could not load the product catalog: ${error.message}`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = getSupabaseCatalogClient();
  if (!supabase) return localProducts.find((product) => product.slug === slug);

  const { data, error } = await supabase
    .from('products')
    .select('id,name,slug,description,full_description,price,stock,is_new,image_url')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load this product: ${error.message}`);
  return data ? mapProduct(data as ProductRow) : undefined;
}

export type ApiResponse<T> = {
  status: boolean;
  statusCode: number;
  message: string;
  data: T | null;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  let payload: ApiResponse<T>;
  try {
    payload = await response.json() as ApiResponse<T>;
  } catch {
    throw new ApiError('The server returned an invalid response.', response.status);
  }

  if (!response.ok || !payload.status) throw new ApiError(payload.message || 'Request failed.', payload.statusCode || response.status);
  return payload.data as T;
}

export const getServices = () => apiRequest<Service[]>('/services', { cache: 'no-store' });
export const getProducts = () => apiRequest<Product[]>('/products', { cache: 'no-store' });
export const getProduct = (slug: string) => apiRequest<Product>(`/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });

export type ImageAsset = { url: string; publicId: string };
export type Service = { _id: string; name: string; description: string; price: number; image?: ImageAsset; createdAt?: string };
export type Product = { _id: string; name: string; slug: string; description: string; fullDescription: string; price: number; image?: ImageAsset; stock: number; isNew: boolean; createdAt?: string };
export type Order = { _id: string; customerName: string; phone: string; address: string; productId: Product | string; quantity: number; notes?: string; paymentMethod: 'Cash on Delivery'; status: 'Pending' | 'Confirmed' | 'Delivered'; createdAt?: string };
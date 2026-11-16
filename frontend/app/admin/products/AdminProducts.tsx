'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Product } from '@/lib/content';
import { getSupabaseAdminUserId, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

type ProductDraft = {
  name: string;
  slug: string;
  description: string;
  fullDescription: string;
  price: string;
  stock: string;
  isNew: boolean;
  imageUrl: string;
};

type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

type AdminOrderItem = {
  product_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
};

type AdminOrder = {
  order_number: number;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  items: AdminOrderItem[];
  total: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
};

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  slug: '',
  description: '',
  fullDescription: '',
  price: '',
  stock: '0',
  isNew: false,
  imageUrl: ''
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const STORAGE_MARKER = '/storage/v1/object/public/product-images/';

function toDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    fullDescription: product.fullDescription,
    price: String(product.price),
    stock: String(product.stock),
    isNew: product.isNew,
    imageUrl: product.image?.url ?? ''
  };
}

function getStoragePath(imageUrl: string): string | null {
  const markerIndex = imageUrl.indexOf(STORAGE_MARKER);
  if (markerIndex < 0) return null;
  return imageUrl.slice(markerIndex + STORAGE_MARKER.length).split('?')[0];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [activeSection, setActiveSection] = useState<'products' | 'orders'>('products');
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [clearImage, setClearImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isConfigured = isSupabaseConfigured() && Boolean(getSupabaseAdminUserId());

  const loadProducts = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: queryError } = await supabase
      .from('products')
      .select('id,name,slug,description,full_description,price,stock,is_new,image_url')
      .order('created_at', { ascending: true });

    if (queryError) throw queryError;
    setProducts((data ?? []).map((row) => ({
      _id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string,
      fullDescription: row.full_description as string,
      price: Number(row.price),
      stock: Number(row.stock),
      isNew: Boolean(row.is_new),
      image: row.image_url ? { url: row.image_url as string } : undefined
    })));
  }, []);

  const loadOrders = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: queryError } = await supabase
      .from('orders')
      .select('order_number,customer_name,phone,email,address,city,postal_code,items,total,payment_method,status,created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (queryError) throw queryError;
    setOrders((data ?? []) as AdminOrder[]);
  }, []);

  useEffect(() => {
    let active = true;
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      const session = data.session;
      if (!session) {
        window.location.replace('/admin/login');
        return;
      }
      if (session.user.id !== getSupabaseAdminUserId()) {
        await supabase.auth.signOut();
        if (active) window.location.replace('/admin/login');
        return;
      }

      setAdminEmail(session.user.email ?? '');
      setIsAuthorized(true);
      try {
        await Promise.all([loadProducts(), loadOrders()]);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) window.location.replace('/admin/login');
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [isConfigured, loadOrders, loadProducts]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = window.setInterval(() => {
      void loadOrders().catch((loadError: unknown) => setError(getErrorMessage(loadError)));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isAuthorized, loadOrders]);

  function resetEditor() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setImageFile(null);
    setClearImage(false);
    setError('');
  }

  function startEditing(product: Product) {
    setDraft(toDraft(product));
    setEditingId(product._id);
    setImageFile(null);
    setClearImage(false);
    setError('');
    setNotice('');
    document.getElementById('product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateField(field: keyof ProductDraft, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError('');
    setNotice('');
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setError('');
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setImageFile(file);
    setClearImage(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const name = draft.name.trim();
    const slug = draft.slug.trim().toLowerCase();
    const price = Number(draft.price);
    const stock = Number(draft.stock);
    if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError('Enter a product name and a URL slug using lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(price) ||
      !Number.isFinite(stock) || stock < 0 || !Number.isSafeInteger(stock)) {
      setError('Price and stock must be zero or a positive whole number.');
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    const previousImageUrl = editingId ? products.find((product) => product._id === editingId)?.image?.url ?? '' : '';

    try {
      const supabase = getSupabaseBrowserClient();
      const productId = editingId ?? crypto.randomUUID();
      let imageUrl = clearImage ? null : draft.imageUrl || null;

      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        uploadedPath = `${productId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(uploadedPath, imageFile, { contentType: imageFile.type, upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('product-images').getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error: saveError } = await supabase.from('products').upsert({
        id: productId,
        name,
        slug,
        description: draft.description.trim(),
        full_description: draft.fullDescription.trim(),
        price,
        stock,
        is_new: draft.isNew,
        image_url: imageUrl
      });
      if (saveError) throw saveError;

      const savedProduct: Product = {
        _id: productId,
        name,
        slug,
        description: draft.description.trim(),
        fullDescription: draft.fullDescription.trim(),
        price,
        stock,
        isNew: draft.isNew,
        image: imageUrl ? { url: imageUrl } : undefined
      };
      setProducts((current) => editingId
        ? current.map((product) => product._id === editingId ? savedProduct : product)
        : [...current, savedProduct]);

      const oldImagePath = getStoragePath(previousImageUrl);
      const newImagePath = imageUrl ? getStoragePath(imageUrl) : null;
      if (oldImagePath && oldImagePath !== newImagePath) {
        try {
          const { error: cleanupError } = await supabase.storage.from('product-images').remove([oldImagePath]);
          if (cleanupError) console.warn('[admin] Could not remove the replaced product image.', cleanupError);
        } catch (cleanupError) {
          console.warn('[admin] Could not remove the replaced product image.', cleanupError);
        }
      }

      const wasEditing = Boolean(editingId);
      resetEditor();
      setNotice(wasEditing ? 'Product updated. Store pages may take up to 60 seconds to refresh.' : 'Product added. Store pages may take up to 60 seconds to refresh.');
    } catch (saveError) {
      if (uploadedPath) {
        const { error: cleanupError } = await getSupabaseBrowserClient().storage.from('product-images').remove([uploadedPath]);
        if (cleanupError) console.warn('[admin] Could not remove an unused uploaded image.', cleanupError);
      }
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}" from the catalog?`)) return;
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from('products').delete().eq('id', product._id);
      if (deleteError) throw deleteError;

      const imagePath = getStoragePath(product.image?.url ?? '');
      let imageCleanupFailed = false;
      if (imagePath) {
        try {
          const { error: imageError } = await supabase.storage.from('product-images').remove([imagePath]);
          if (imageError) imageCleanupFailed = true;
        } catch (imageError) {
          imageCleanupFailed = true;
          console.warn('[admin] Could not remove a deleted product image.', imageError);
        }
      }
      setProducts((current) => current.filter((entry) => entry._id !== product._id));
      if (editingId === product._id) resetEditor();
      setNotice(imageCleanupFailed
        ? 'Product deleted, but its old image could not be removed from storage.'
        : 'Product deleted. Store pages may take up to 60 seconds to refresh.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(orderNumber: number, status: OrderStatus) {
    setError('');
    setNotice('');
    try {
      const { data, error: updateError } = await getSupabaseBrowserClient()
        .from('orders')
        .update({ status })
        .eq('order_number', orderNumber)
        .select('order_number')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error('Order status was not updated. Check that the orders SQL setup is complete.');
      setOrders((current) => current.map((order) =>
        order.order_number === orderNumber ? { ...order, status } : order
      ));
      setNotice(`Order #${orderNumber} marked ${status.toLowerCase()}.`);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    }
  }

  async function handleSignOut() {
    const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut();
    if (signOutError) setError(signOutError.message);
    else window.location.replace('/admin/login');
  }

  if (!isConfigured) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-box">
          <p className="eyebrow">Admin setup</p>
          <h1>Almost<br /><em>ready.</em></h1>
          <p className="admin-login-copy">Add the Supabase project URL, publishable key, and admin user ID to <code>frontend/.env.local</code> for local development, or to your hosting environment before deploying.</p>
          <Link className="admin-back-link" href="/">← Back to website</Link>
        </section>
      </main>
    );
  }

  if (loading || !isAuthorized) {
    return <main className="admin-loading"><span className="spinner" aria-label="Loading admin" /></main>;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/">Sundas<span>Beauty Parlour</span></Link>
        <p className="admin-sidebar-label">Store management</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a className={activeSection === 'products' ? 'active' : ''} href="#products" onClick={() => setActiveSection('products')}>Products</a>
          <a className={activeSection === 'orders' ? 'active' : ''} href="#orders" onClick={() => setActiveSection('orders')}>Orders <span className="admin-order-count">{orders.filter((order) => order.status === 'Pending').length}</span></a>
        </nav>
        <p className="admin-email">{adminEmail}</p>
        <button className="admin-logout" type="button" onClick={handleSignOut}>Sign out <span aria-hidden="true">↗</span></button>
      </aside>

      <main className="admin-main">
        <section className="admin-page">
          <header className="admin-page-heading">
            <div>
              <p className="eyebrow">Store dashboard</p>
              <h1>Products<br /><em>and prices.</em></h1>
              <p className="admin-description">Manage the items shown to every visitor on your website.</p>
            </div>
            <button className="admin-primary" type="button" onClick={resetEditor}>Add product <span aria-hidden="true">＋</span></button>
          </header>

          <div className="admin-stats">
            <article className="admin-stat admin-stat-1"><span>Products</span><strong>{products.length}</strong><small>In your catalog</small></article>
            <article className="admin-stat admin-stat-2"><span>With photos</span><strong>{products.filter((product) => product.image?.url).length}</strong><small>Ready for customers</small></article>
            <article className="admin-stat admin-stat-3"><span>Pending orders</span><strong>{orders.filter((order) => order.status === 'Pending').length}</strong><small>{orders.length} total orders</small></article>
          </div>

          {error && <p className="admin-error admin-global-message" role="alert">{error}</p>}
          {notice && <p className="admin-notice admin-global-message" role="status">{notice}</p>}

          <section id="products" className="admin-product-section">
            <div className="admin-section-heading"><div><p className="eyebrow">Catalog</p><h2>Your products</h2></div><Link href="/products" target="_blank" rel="noreferrer">View store ↗</Link></div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td><div className="admin-product-name">{product.image?.url ? <Image src={product.image.url} alt="" width={54} height={54} unoptimized /> : <span className="admin-no-image">No image</span>}<div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td>
                      <td><strong className="admin-price">PKR {product.price.toLocaleString('en-PK')}</strong></td>
                      <td>{product.stock}</td>
                      <td><span className={product.isNew ? 'status status-good' : 'status'}>{product.isNew ? 'New' : 'Regular'}</span></td>
                      <td><div className="admin-actions"><button type="button" onClick={() => startEditing(product)}>Edit</button><button className="danger" type="button" onClick={() => void deleteProduct(product)} disabled={saving}>Delete</button></div></td>
                    </tr>
                  ))}
                  {!products.length && <tr><td colSpan={5}>No products yet. Add your first product below.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section id="orders" className="admin-product-section">
            <div className="admin-section-heading"><div><p className="eyebrow">Customer requests</p><h2>Orders</h2></div><span className="admin-order-caption">Latest 100 orders</span></div>
            <div className="admin-table-wrap">
              <table className="admin-table admin-orders-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_number}>
                      <td><strong>#{order.order_number}</strong><small>{new Date(order.created_at).toLocaleString('en-PK')}</small></td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <small><a href={`tel:${order.phone}`}>{order.phone}</a></small>
                        {order.email && <small>{order.email}</small>}
                        <small>{[order.address, order.city, order.postal_code].filter(Boolean).join(', ')}</small>
                      </td>
                      <td><div className="admin-order-items">{order.items.map((item) => (
                        <div className="admin-order-item" key={item.product_id}>
                          {item.image_url
                            ? <Image src={item.image_url} alt="" width={38} height={38} unoptimized />
                            : <span className="admin-no-image">No image</span>}
                          <span><strong>{item.name}</strong><small>{item.quantity} × PKR {item.unit_price.toLocaleString('en-PK')}</small></span>
                        </div>
                      ))}</div></td>
                      <td><strong className="admin-price">PKR {Number(order.total).toLocaleString('en-PK')}</strong><small>{order.payment_method}</small></td>
                      <td><select className={`status-select status-${order.status.toLowerCase()}`} value={order.status} onChange={(event) => void updateOrderStatus(order.order_number, event.target.value as OrderStatus)} aria-label={`Update status for order ${order.order_number}`}>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select></td>
                    </tr>
                  ))}
                  {!orders.length && <tr><td colSpan={5}>No orders yet. Customer orders will appear here after they prepare a WhatsApp order.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <form id="product-editor" className="admin-editor admin-product-editor" onSubmit={handleSave}>
            <div><p className="eyebrow">{editingId ? 'Update catalog' : 'Grow your catalog'}</p><h2>{editingId ? 'Edit product' : 'Add a product'}</h2></div>
            <div className="admin-editor-grid">
              <label>Product name<input value={draft.name} onChange={(event) => updateField('name', event.target.value)} required maxLength={120} /></label>
              <label>URL slug<input value={draft.slug} onChange={(event) => updateField('slug', event.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} placeholder="product-name" /></label>
              <label>Price (PKR)<input type="number" min="0" step="1" value={draft.price} onChange={(event) => updateField('price', event.target.value)} required /></label>
              <label>Stock quantity<input type="number" min="0" step="1" value={draft.stock} onChange={(event) => updateField('stock', event.target.value)} required /></label>
              <label className="admin-editor-full">Short description<textarea value={draft.description} onChange={(event) => updateField('description', event.target.value)} rows={2} maxLength={240} /></label>
              <label className="admin-editor-full">Full description<textarea value={draft.fullDescription} onChange={(event) => updateField('fullDescription', event.target.value)} rows={3} maxLength={2000} /></label>
              <label className="admin-editor-full">Product photo (JPG, PNG, WebP; up to 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} /></label>
              {(previewUrl || (!clearImage && draft.imageUrl)) && <Image className="admin-image-preview" src={previewUrl || draft.imageUrl} alt="Product preview" width={160} height={160} unoptimized />}
              {draft.imageUrl && !imageFile && <label className="admin-check admin-editor-full"><input type="checkbox" checked={clearImage} onChange={(event) => setClearImage(event.target.checked)} /> Remove current photo</label>}
              <label className="admin-check admin-editor-full"><input type="checkbox" checked={draft.isNew} onChange={(event) => updateField('isNew', event.target.checked)} /> Mark as a new product</label>
            </div>
            <div className="admin-editor-actions">
              <button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add product'} <span aria-hidden="true">↗</span></button>
              {editingId && <button className="admin-cancel" type="button" onClick={resetEditor} disabled={saving}>Cancel</button>}
              <small>Changes appear on the public store within about one minute.</small>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

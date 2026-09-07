'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, ApiError, Order, Product, Service } from '@/lib/api';
import { getAdminToken } from '@/lib/adminAuth';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{ services: number; products: number; pending: number } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    Promise.all([apiRequest<Service[]>('/services'), apiRequest<Product[]>('/products'), apiRequest<Order[]>('/orders', {}, token)])
      .then(([services, products, orders]) => setStats({ services: services.length, products: products.length, pending: orders.filter((order) => order.status === 'Pending').length }))
      .catch((requestError) => { if (requestError instanceof ApiError && requestError.statusCode === 401) router.replace('/admin/login'); else setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong. Please try again.'); });
  }, [router]);
  if (!stats && !error) return <div className="admin-loading">Loading dashboard...</div>;
  const cards = stats ? [{ label: 'Total services', value: stats.services }, { label: 'Total products', value: stats.products }, { label: 'Pending orders', value: stats.pending }] : [];
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Overview</p><h1>Good morning, <em>admin.</em></h1></div><span className="admin-date">Live workspace</span></div>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-stats">{cards.map((stat, index) => <article className={`admin-stat admin-stat-${index + 1}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>Live from backend</small></article>)}</div><div className="admin-note"><p className="eyebrow">Today</p><h2>Keep the details considered.</h2><p>Use the workspace to keep your service menu, products and COD orders up to date.</p></div></section>;
}
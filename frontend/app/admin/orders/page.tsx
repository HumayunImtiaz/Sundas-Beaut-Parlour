'use client';

import { useEffect, useState } from 'react';
import { apiRequest, ApiError, Order } from '@/lib/api';
import { clearAdminToken, getAdminToken } from '@/lib/adminAuth';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const router = useRouter(); const [orders, setOrders] = useState<Order[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  function handleError(requestError: unknown) { if (requestError instanceof ApiError && requestError.statusCode === 401) { clearAdminToken(); router.replace('/admin/login'); return; } setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong. Please try again.'); }
  async function load() { const token = getAdminToken(); if (!token) return router.replace('/admin/login'); try { setOrders(await apiRequest<Order[]>('/orders', {}, token)); } catch (requestError) { handleError(requestError); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function updateStatus(id: string, status: Order['status']) { const token = getAdminToken(); if (!token) return router.replace('/admin/login'); try { await apiRequest(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token); await load(); } catch (requestError) { handleError(requestError); } }
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Sales</p><h1>Orders</h1><p className="admin-description">Cash on Delivery orders from your product menu.</p></div></div>{error && <p className="admin-error" role="alert">{error}</p>}{loading ? <div className="admin-loading">Loading orders...</div> : <div className="admin-table-wrap"><table className="admin-table orders-table"><thead><tr><th>Customer</th><th>Product</th><th>Address</th><th>Notes</th><th>Status</th></tr></thead><tbody>{orders.map((order) => { const product = typeof order.productId === 'string' ? order.productId : order.productId.name; return <tr key={order._id}><td><strong>{order.customerName}</strong><small>{order.phone}</small></td><td><b className="admin-order-product">{product}</b><small>Quantity: {order.quantity}</small></td><td>{order.address}</td><td>{order.notes || '—'}</td><td><select aria-label={`Status for ${order.customerName}`} className={`status-select status-${order.status.toLowerCase()}`} onChange={(event) => void updateStatus(order._id, event.target.value as Order['status'])} value={order.status}><option>Pending</option><option>Confirmed</option><option>Delivered</option></select></td></tr>; })}</tbody></table></div>}</section>;
}
'use client';

import { useState } from 'react';

type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered';
type Order = { id: number; name: string; phone: string; address: string; product: string; quantity: number; notes: string; status: OrderStatus };
const initialOrders: Order[] = [
  { id: 1, name: 'Ayesha Khan', phone: '0300 1234567', address: 'Gulberg, Lahore', product: 'Herbal Hair Oil', quantity: 2, notes: 'Please call before delivery.', status: 'Pending' },
  { id: 2, name: 'Maham Ali', phone: '0312 7654321', address: 'DHA Phase 5, Lahore', product: 'Ubtan', quantity: 1, notes: '', status: 'Confirmed' },
  { id: 3, name: 'Sara Ahmed', phone: '0333 9876543', address: 'Model Town, Lahore', product: 'Face Whitening Cream', quantity: 1, notes: 'Leave at reception.', status: 'Delivered' }
];

export default function AdminOrdersPage() { const [orders, setOrders] = useState(initialOrders); return <section className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Sales</p><h1>Orders</h1><p className="admin-description">Cash on Delivery orders from your product menu.</p></div></div><div className="admin-table-wrap"><table className="admin-table orders-table"><thead><tr><th>Customer</th><th>Product</th><th>Address</th><th>Notes</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.name}</strong><small>{order.phone}</small></td><td><b className="admin-order-product">{order.product}</b><small>Quantity: {order.quantity}</small></td><td>{order.address}</td><td>{order.notes || '—'}</td><td><select aria-label={`Status for ${order.name}`} className={`status-select status-${order.status.toLowerCase()}`} onChange={(event) => setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: event.target.value as OrderStatus } : item))} value={order.status}><option>Pending</option><option>Confirmed</option><option>Delivered</option></select></td></tr>)}</tbody></table></div></section>; }
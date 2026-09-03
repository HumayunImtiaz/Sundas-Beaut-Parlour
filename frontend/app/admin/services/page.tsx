'use client';

import { FormEvent, useState } from 'react';
import { services as initialServices, Service } from '@/lib/data';

type ServiceForm = Pick<Service, 'name' | 'price' | 'description' | 'image'>;
const blank: ServiceForm = { name: '', price: '', description: '', image: '' };

export default function AdminServicesPage() {
  const [items, setItems] = useState(initialServices);
  const [form, setForm] = useState<ServiceForm>(blank);
  const [editing, setEditing] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = editing ?? `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    const service: Service = { ...form, slug, fullDescription: form.description, category: 'Service' };
    // Temporary local mutation. Replace with POST/PATCH/DELETE API calls when the backend is ready.
    setItems((current) => editing ? current.map((item) => item.slug === editing ? { ...item, ...service } : item) : [...current, service]);
    setForm(blank); setEditing(null);
  }
  function edit(item: Service) { setEditing(item.slug); setForm({ name: item.name, price: item.price, description: item.description, image: item.image }); }

  return <section className="admin-page"><AdminHeader title="Services" description="Manage the treatments shown on your public menu." action={editing !== null ? 'Cancel' : 'Add service'} onAction={() => { setEditing(editing !== null ? null : ''); setForm(blank); }} /><div className="admin-table-wrap"><table className="admin-table services-table"><thead><tr><th>Name</th><th>Price</th><th>Description</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.slug}><td><strong>{item.name}</strong><small>{item.category}</small></td><td><b className="admin-price">{item.price}</b></td><td>{item.description}</td><td><div className="admin-actions"><button onClick={() => edit(item)} type="button">Edit</button><button className="danger" onClick={() => setItems((current) => current.filter((entry) => entry.slug !== item.slug))} type="button">Delete</button></div></td></tr>)}</tbody></table></div>{editing !== null && <AdminEditor title={editing ? 'Edit service' : 'Add service'} onSubmit={save}><Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field label="Price" value={form.price} onChange={(value) => setForm({ ...form, price: value })} /><Field label="Short description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><Field label="Image URL" value={form.image} onChange={(value) => setForm({ ...form, image: value })} /><button className="admin-primary bg-gradient-gold" type="submit">Save service</button></AdminEditor>}</section>;
}

  function AdminHeader({ title, description, action, onAction }: { title: string; description: string; action: string; onAction: () => void }) { return <div className="admin-page-heading"><div><p className="eyebrow">Catalog</p><h1>{title}</h1><p className="admin-description">{description}</p></div><button className="admin-primary bg-gradient-gold" onClick={onAction} type="button">{action} <span aria-hidden="true">+</span></button></div>; }
  function AdminEditor({ title, onSubmit, children }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: React.ReactNode }) { return <form className="admin-editor" onSubmit={onSubmit}><h2>{title}</h2>{children}</form>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label>{label}<input required onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
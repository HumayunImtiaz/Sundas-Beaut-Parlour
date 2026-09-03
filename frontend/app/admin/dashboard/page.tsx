import { services } from '@/lib/data';
import { homeRemedies } from '@/lib/homeRemedies';

const pendingOrders = 2;

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total services', value: services.length },
    { label: 'Total products', value: homeRemedies.length },
    { label: 'Pending orders', value: pendingOrders }
  ];
  return <section className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Overview</p><h1>Good morning, <em>admin.</em></h1></div><span className="admin-date">Local workspace</span></div><div className="admin-stats">{stats.map((stat, index) => <article className={`admin-stat admin-stat-${index + 1}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>Updated from local data</small></article>)}</div><div className="admin-note"><p className="eyebrow">Today</p><h2>Keep the details considered.</h2><p>Use the workspace to keep your service menu, home remedies and COD orders up to date.</p></div></section>;
}
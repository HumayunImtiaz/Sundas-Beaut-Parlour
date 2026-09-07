'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { clearAdminToken, getAdminToken } from '@/lib/adminAuth';

const navigation = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Services', href: '/admin/services' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' }
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isLogin = pathname === '/admin/login';
  const [ready, setReady] = useState(isLogin);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getAdminToken()) router.replace('/admin/login');
    else setReady(true);
  }, [isLogin, router]);

  function logout() {
    clearAdminToken();
    router.replace('/admin/login');
  }

  if (isLogin) return <>{children}</>;
  if (!ready) return <div className="admin-loading">Checking access...</div>;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/dashboard">Sundas <span>Admin</span></Link>
        <p className="admin-sidebar-label">Workspace</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map((item) => <Link className={pathname === item.href ? 'active' : ''} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <button className="theme-toggle admin-theme-toggle" onClick={toggleTheme} type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? '☼' : '☾'} <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
        <button className="admin-logout" onClick={logout} type="button">Log out <span aria-hidden="true">↗</span></button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
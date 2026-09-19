'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';
import { useTheme } from '../../theme/ThemeProvider';
import { CART_UPDATED_EVENT, type CartUpdatedDetail } from '@/lib/cart-events';

const homeLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Products', href: '#products' },
  { label: 'Location', href: '#location' }
];

const pageLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/#services' },
  { label: 'Products', href: '/products' },
  { label: 'Location', href: '/#location' }
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const links = pathname === '/' ? homeLinks : pageLinks;

  useEffect(() => {
    async function refreshCartCount() {
      try {
        const response = await fetch('/api/cart', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { cart?: { items?: { quantity: number }[] } | null };
        setCartItemCount(data.cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0);
      } catch {
        setCartItemCount(0);
      }
    }

    function handleCartUpdated(event: Event) {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail;
      const itemCount = detail?.itemCount;
      if (typeof itemCount === 'number') setCartItemCount(itemCount);
      else if (typeof detail?.delta === 'number') setCartItemCount((current) => Math.max(0, current + detail.delta!));
      else void refreshCartCount();
    }

    void refreshCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
  }, []);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 40);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className={`navbar ${scrolled ? 'navbar-scrolled-text navbar-gradient' : ''}`}
    >
      <a className="wordmark" href={pathname === '/' ? '#top' : '/'} aria-label="Sundas Beauty Parlour home">
        Sundas <span>Beauty Parlour</span>
      </a>
      <nav aria-label="Main navigation" id="main-navigation" className={menuOpen ? 'mobile-menu-open' : ''}>
        {links.map((link) => <a href={link.href} key={link.href} onClick={closeMenu}>{link.label}</a>)}
      </nav>
      <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? '☼' : '☾'}</button>
      <a className="nav-cta" href={pathname === '/' ? '#services' : '/#services'} onClick={closeMenu}>Book a visit <span aria-hidden="true">↗</span></a>
      <a className="cart-nav-link" href="/cart" aria-label={`View cart${cartItemCount ? `, ${cartItemCount} items` : ''}`} title="View cart" onClick={closeMenu}>
        <FiShoppingBag aria-hidden="true" />
        {cartItemCount > 0 && <span className="cart-nav-badge" aria-label={`${cartItemCount} items in cart`}>{cartItemCount}</span>}
      </a>
      <button className="nav-menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>
        <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>
    </header>
  );
}

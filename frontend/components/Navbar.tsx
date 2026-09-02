'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

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
  const [scrolled, setScrolled] = useState(false);
  const links = pathname === '/' ? homeLinks : pageLinks;

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 40);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <header
      className={`navbar ${scrolled ? 'navbar-scrolled-text' : ''}`}
      style={{ backgroundColor: scrolled ? 'var(--color-gold-dark)' : 'var(--color-bg)' }}
    >
      <a className="wordmark" href={pathname === '/' ? '#top' : '/'} aria-label="Sundas Beauty Parlour home">
        Sundas <span>Beauty Parlour</span>
      </a>
      <nav aria-label="Main navigation">
        {links.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
      </nav>
      <a className="nav-cta" href={pathname === '/' ? '#services' : '/#services'}>Book a visit <span aria-hidden="true">↗</span></a>
    </header>
  );
}

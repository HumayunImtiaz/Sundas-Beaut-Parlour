import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './theme/ThemeProvider';

const heading = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600']
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600']
});

export const metadata: Metadata = {
  title: 'Sundas Beauty Parlour | Beauty, considered',
  description: 'A considered beauty experience for your everyday and extraordinary moments.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable} antialiased`}><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}

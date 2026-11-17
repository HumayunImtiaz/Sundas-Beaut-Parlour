'use client';

import { useEffect } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from './providers/ToastProvider';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { showToast } = useToast();
  const message = getErrorMessage(error, 'An unexpected error stopped this page from loading.');

  useEffect(() => {
    showToast(message);
  }, [message, showToast]);

  return (
    <main className="admin-login-page">
      <section className="admin-login-box" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>Page<br /><em>unavailable.</em></h1>
        <p className="admin-login-copy">{message}</p>
        <button className="admin-primary" type="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}

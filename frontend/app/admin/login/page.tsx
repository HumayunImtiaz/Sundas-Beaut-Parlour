'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, ApiError } from '@/lib/api';
import { setAdminToken } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAdminToken(result.token);
      router.replace('/admin/dashboard');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Something went wrong. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-box">
        <p className="eyebrow">Sundas Beauty Parlour</p>
        <h1>Welcome <em>back.</em></h1>
        <p className="admin-login-copy">Sign in to manage your parlour workspace.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Password<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-primary bg-gradient-gold" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in...' : 'Login'} <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </main>
  );
}
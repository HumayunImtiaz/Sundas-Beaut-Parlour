'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

// Temporary mock credential. Replace with real backend authentication when the API is ready.
const MOCK_ADMIN = { email: 'admin@sundasparlour.com', password: 'sundas123' };

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== MOCK_ADMIN.email || password !== MOCK_ADMIN.password) {
      setError('The email or password is not correct.');
      return;
    }
    window.localStorage.setItem('isAdminLoggedIn', 'true');
    router.replace('/admin/dashboard');
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
          <button className="admin-primary bg-gradient-gold" type="submit">Login <span aria-hidden="true">↗</span></button>
        </form>
      </div>
    </main>
  );
}
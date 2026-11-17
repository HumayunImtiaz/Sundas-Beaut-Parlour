'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/errors';
import { getSupabaseAdminUserId, getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '../../providers/ToastProvider';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !getSupabaseAdminUserId()) return;

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (data.session?.user.id === getSupabaseAdminUserId()) router.replace('/admin');
    }).catch((sessionError: unknown) => {
      showToast(getErrorMessage(sessionError, 'Could not verify your admin session.'));
    });
  }, [router, showToast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      showToast('Enter both your admin email address and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('Enter a valid email address.');
      return;
    }
    const adminUserId = getSupabaseAdminUserId();
    if (!isSupabaseConfigured() || !adminUserId) {
      showToast('Admin setup is incomplete. Add the Supabase project URL, publishable key, and admin user ID to frontend/.env.local, then restart the dev server.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      if (data.user.id !== adminUserId) {
        await supabase.auth.signOut();
        throw new Error('This account is not permitted to manage the product catalog.');
      }
      router.replace('/admin');
    } catch (loginError) {
      showToast(getErrorMessage(loginError, 'Could not sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured() || !getSupabaseAdminUserId()) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-box">
          <p className="eyebrow">Admin setup</p>
          <h1>Almost<br /><em>ready.</em></h1>
          <p className="admin-login-copy">Configure Supabase and create your owner account before signing in. For local development, set the Supabase variables in <code>frontend/.env.local</code>, then restart the dev server. Full setup steps are in the project README.</p>
          <a className="admin-back-link" href="/">← Back to website</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-box">
        <p className="eyebrow">Sundas Beauty Parlour</p>
        <h1>Admin<br /><em>sign in.</em></h1>
        <p className="admin-login-copy">Sign in to manage products, prices, and photos.</p>
        <form className="admin-form" noValidate onSubmit={handleSubmit}>
          <label>
            Email address
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="admin-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <a className="admin-back-link" href="/">← Back to website</a>
      </section>
    </main>
  );
}

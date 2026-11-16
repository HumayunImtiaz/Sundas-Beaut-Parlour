import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  return url?.replace(/\/rest\/v1$/i, '');
}

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let browserClient: SupabaseClient | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && supabaseKey);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key to the frontend environment.');
  }
  browserClient ??= createClient(url, key);
  return browserClient;
}

export function getSupabaseAdminUserId(): string | undefined {
  const configuredIds = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_USER_ID?.trim().split(/\s+/);
  if (!configuredIds?.length || configuredIds.some((id) => id !== configuredIds[0])) return undefined;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(configuredIds[0])
    ? configuredIds[0]
    : undefined;
}

export function getSupabaseCatalogClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = getSupabaseUrl();
  if (!url || !supabaseKey) return null;
  return createClient(url, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

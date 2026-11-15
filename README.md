# Sundas Beauty Parlour

Frontend website for Sundas Beauty Parlour, built with Next.js.

## Structure

- `frontend` - Next.js 14 App Router, TypeScript, and Tailwind CSS

## Run Locally

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The cart is stored in the visitor's browser. The product catalog uses Supabase when configured and falls back to the local sample catalog otherwise. Orders are prepared as WhatsApp messages for the salon to confirm at `0308 7986760`. Configure the map URL in `frontend/.env.local` before using the map feature.

## Production Environment

Set these variables in the frontend hosting dashboard before deploying:

```text
NEXT_PUBLIC_MAP_EMBED_URL=https://www.google.com/maps?q=Sundas+Beauty+Parlour&output=embed
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/
```

The storefront does not require Medusa environment variables. In Vercel, import this repository and set:

- **Root Directory:** `frontend`
- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build`
- **Output Directory:** leave the default

## Product Admin (Supabase Free)

The admin at `/admin` lets the authorized owner add, edit, and delete products, set PKR prices and stock, and upload photos. Product data and images are shared with all website visitors. Medusa is not required.

1. Create a free Supabase project. In **Authentication → Users**, create the owner's email/password user manually. Turn off public sign-ups in **Authentication → Settings**.
2. Copy the new user's **UID**. In the Supabase SQL Editor, run the SQL below, replacing `PASTE_ADMIN_USER_UID_HERE` with that UID.
3. In **Project Settings → API**, copy the Project URL and publishable key. Set these Vercel Production environment variables and redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ADMIN_USER_ID` (the same user UID)
4. Open `/admin` on the deployed website and sign in with the email/password created in Supabase.

The publishable key is intended for browser use. Row Level Security restricts product changes and image uploads to the configured admin UID. Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable or in frontend code. The app also accepts the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable if already configured.

```sql
create table public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  full_description text not null default '',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_new boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create or replace function public.is_catalog_admin()
returns boolean
language sql
stable
as $$
  select (select auth.uid()) = 'PASTE_ADMIN_USER_UID_HERE'::uuid
$$;

revoke all on function public.is_catalog_admin() from public;
grant execute on function public.is_catalog_admin() to authenticated;

create policy "Anyone can view products"
  on public.products for select to anon, authenticated using (true);
create policy "Only the owner can manage products"
  on public.products for all to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));

insert into public.products
  (id, name, slug, description, full_description, price, stock, is_new)
values
  ('product-hydrating-mask', 'Hydrating Hair Mask', 'hydrating-hair-mask',
   'A rich at-home treatment for soft, glossy hair.',
   'Keep your salon finish going with this nourishing hydrating mask, selected for dry and tired hair.',
   2800, 10, true),
  ('product-glow-cleanser', 'Daily Glow Cleanser', 'daily-glow-cleanser',
   'A gentle cleanser for a calm, bright complexion.',
   'A daily cleansing ritual that leaves skin feeling comfortable, clean and refreshed without stripping it.',
   2200, 10, false),
  ('product-silk-serum', 'Silk Finish Serum', 'silk-finish-serum',
   'Lightweight shine and smoothness for finished hair.',
   'A few drops of this lightweight serum tame flyaways and leave hair with a soft, polished finish.',
   2400, 10, false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Anyone can view product photos"
  on storage.objects for select to public using (bucket_id = 'product-images');
create policy "Only the owner can upload product photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_catalog_admin()));
create policy "Only the owner can update product photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_catalog_admin()))
  with check (bucket_id = 'product-images' and (select public.is_catalog_admin()));
create policy "Only the owner can delete product photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_catalog_admin()));
```

In Supabase Storage, the bucket is public only for displaying product photos; uploads, replacements, and deletion are limited by the admin policy. The free tier has usage limits and may pause projects after inactivity.
This project currently working 
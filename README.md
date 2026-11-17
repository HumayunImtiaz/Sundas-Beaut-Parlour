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
3. In **Project Settings → API**, copy the Project URL (the base URL only, e.g. `https://your-project.supabase.co`, without `/rest/v1/`) and publishable key. Set these Vercel Production environment variables and redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ADMIN_USER_ID` (the same user UID)
4. Open `/admin` on the deployed website and sign in with the email/password created in Supabase. `NEXT_PUBLIC_SUPABASE_ADMIN_USER_ID` must contain the admin user's UUID exactly once; the SQL function below uses the same UUID.

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

### Orders in the admin panel

Run this additional SQL once in the Supabase SQL Editor, replacing `PASTE_ADMIN_USER_UID_HERE` with the same single UUID used for `NEXT_PUBLIC_SUPABASE_ADMIN_USER_ID`. Customer orders are created by the `place_order` RPC, which looks up current product prices and photos in the database; customers cannot directly read or change saved orders. Only the configured admin can view orders and update their status.

```sql
create table if not exists public.orders (
  order_number bigint generated by default as identity primary key,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  postal_code text,
  items jsonb not null,
  total bigint not null check (total >= 0),
  payment_method text not null default 'Cash on Delivery',
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop policy if exists "Only the owner can view orders" on public.orders;
create policy "Only the owner can view orders"
  on public.orders for select to authenticated
  using ((select public.is_catalog_admin()));
drop policy if exists "Only the owner can update orders" on public.orders;
create policy "Only the owner can update orders"
  on public.orders for update to authenticated
  using ((select public.is_catalog_admin()))
  with check ((select public.is_catalog_admin()));

create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_city text,
  p_postal_code text,
  p_items jsonb
)
returns table (order_number bigint, created_at timestamptz, total bigint, items jsonb)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_product_id text;
  v_quantity integer;
  v_name text;
  v_slug text;
  v_image_url text;
  v_price integer;
  v_total bigint := 0;
  v_items jsonb := '[]'::jsonb;
  v_order_number bigint;
  v_created_at timestamptz;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_phone, ''))) not between 7 and 20
     or trim(p_phone) !~ '^\+?[0-9][0-9 ()-]{5,18}[0-9]$'
     or length(trim(coalesce(p_address, ''))) not between 3 and 500
     or length(trim(coalesce(p_city, ''))) not between 1 and 120
     or (p_email is not null and length(trim(p_email)) > 254)
     or (p_postal_code is not null and length(trim(p_postal_code)) > 32) then
    raise exception 'Please check the customer and delivery details.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'The order must contain between 1 and 20 products.';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then
    raise exception 'The order must contain between 1 and 20 products.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := v_item->>'product_id';
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_product_id, '') !~ '^[a-zA-Z0-9_-]{1,128}$'
       or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,2}$' then
      raise exception 'The order contains an invalid product or quantity.';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity > 99 or v_items @> jsonb_build_array(jsonb_build_object('product_id', v_product_id)) then
      raise exception 'The order contains a duplicate product or invalid quantity.';
    end if;

    select p.name, p.slug, p.image_url, p.price
      into v_name, v_slug, v_image_url, v_price
      from public.products as p
      where p.id = v_product_id and p.stock >= v_quantity;
    if not found then
      raise exception 'A product is unavailable or does not have enough stock.';
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id,
      'name', v_name,
      'slug', v_slug,
      'image_url', v_image_url,
      'quantity', v_quantity,
      'unit_price', v_price
    ));
    v_total := v_total + (v_price::bigint * v_quantity);
  end loop;

  insert into public.orders as new_order (customer_name, phone, email, address, city, postal_code, items, total)
  values (
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(coalesce(p_email, '')), ''),
    trim(p_address),
    trim(p_city),
    nullif(trim(coalesce(p_postal_code, '')), ''),
    v_items,
    v_total
  )
  returning new_order.order_number, new_order.created_at
    into v_order_number, v_created_at;

  return query select v_order_number, v_created_at, v_total, v_items;
end;
$$;

revoke all on function public.place_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, text, jsonb) to anon, authenticated;
```

Order creation checks current prices, but does not reserve/decrement stock. Confirm the order with the customer before delivery.
The checkout saves the order when the customer selects **Prepare WhatsApp Order**, before opening WhatsApp. It stays **Pending** until the admin confirms it, so an order may appear even if the customer does not tap Send in WhatsApp.

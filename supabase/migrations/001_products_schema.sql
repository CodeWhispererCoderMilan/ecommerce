-- ==============================================================
-- NETZAH E-COMMERCE - Product Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- ==============================================================


-- 1. CATEGORIES
-- spec_fields defines which JSONB keys are expected per category,
-- so the future admin form can render the right inputs dynamically.
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon_url    text,
  spec_fields jsonb not null default '[]'::jsonb,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);


-- 2. BRANDS
create table if not exists brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  logo_url   text,
  website    text,
  created_at timestamptz not null default now()
);


-- 3. PRODUCTS
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete set null,
  category_id  uuid references categories(id) on delete set null,
  name         text not null,
  slug         text not null unique,
  description  text,
  specs        jsonb not null default '{}'::jsonb,
  base_price   numeric(10,2) not null default 0,
  badge        text check (badge in ('NOU','LIMITAT','PROMO')),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at
  before update on products
  for each row execute procedure set_updated_at();


-- 4. PRODUCT VARIANTS
-- A variant is a purchasable option (color, switch type, etc.)
-- price overrides base_price when set; otherwise base_price is used.
create table if not exists product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  name           text not null,
  sku            text unique,
  price          numeric(10,2),
  stock_quantity int not null default 0,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);


-- 5. PRODUCT IMAGES
-- Stored in Supabase Storage bucket: product-images
-- Path pattern: {product_slug}/{variant_name}/{filename}
-- variant_id = null means the image applies to all variants.
create table if not exists product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  variant_id    uuid references product_variants(id) on delete cascade,
  storage_path  text not null,
  display_url   text not null,
  display_order int not null default 0,
  is_primary    boolean not null default false,
  alt_text      text,
  created_at    timestamptz not null default now()
);

-- Enforce only one primary image per (product, variant) combination.
create unique index if not exists product_images_one_primary
  on product_images (product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_primary = true;


-- 6. PRODUCT VIDEOS
-- Stored in Supabase Storage bucket: product-videos
create table if not exists product_videos (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  storage_path  text not null,
  display_url   text not null,
  title         text,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);


-- 7. ADMIN USERS
-- Whoever is in this table can write products via the admin panel.
-- To grant admin: INSERT INTO admin_users (id) VALUES ('<auth.users uuid>');
create table if not exists admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- 8. ROW LEVEL SECURITY
alter table categories       enable row level security;
alter table brands            enable row level security;
alter table products          enable row level security;
alter table product_variants  enable row level security;
alter table product_images    enable row level security;
alter table product_videos    enable row level security;
alter table admin_users       enable row level security;

-- Public read on all catalog tables
create policy "public_read_categories"   on categories      for select using (true);
create policy "public_read_brands"       on brands          for select using (true);
create policy "public_read_products"     on products        for select using (is_active = true);
create policy "public_read_variants"     on product_variants for select using (is_active = true);
create policy "public_read_images"       on product_images  for select using (true);
create policy "public_read_videos"       on product_videos  for select using (true);

-- Admin full access on all catalog tables
create policy "admin_all_categories"    on categories      for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_all_brands"        on brands          for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_all_products"      on products        for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_all_variants"      on product_variants for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_all_images"        on product_images  for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_all_videos"        on product_videos  for all using (exists (select 1 from admin_users where id = auth.uid()));
create policy "admin_read_self"         on admin_users     for select using (auth.uid() = id);


-- 9. PRODUCT LISTING VIEW
-- Denormalized view used by product cards and grids.
create or replace view product_listing as
select
  p.id,
  p.name,
  p.slug,
  p.description,
  p.specs,
  p.base_price,
  p.badge,
  p.is_active,
  p.created_at,
  b.name  as brand_name,
  b.slug  as brand_slug,
  c.name  as category_name,
  c.slug  as category_slug,
  (
    select display_url from product_images pi
    where pi.product_id = p.id
      and pi.variant_id is null
      and pi.is_primary = true
    limit 1
  ) as primary_image_url,
  exists (
    select 1 from product_variants pv
    where pv.product_id = p.id
      and pv.stock_quantity > 0
      and pv.is_active = true
  ) as in_stock,
  coalesce(
    (
      select min(pv.price)
      from product_variants pv
      where pv.product_id = p.id
        and pv.is_active = true
        and pv.price is not null
    ),
    p.base_price
  ) as display_price
from products p
left join brands b on b.id = p.brand_id
left join categories c on c.id = p.category_id;


-- 10. SEED: CATEGORIES
insert into categories (name, slug, sort_order, spec_fields) values
(
  'Tastaturi', 'tastaturi', 1,
  '[
    {"key":"layout","label":"Layout","type":"select","options":["40%","60%","65%","75%","TKL","100%","Numpad"]},
    {"key":"switch_type","label":"Tip switch","type":"text"},
    {"key":"connectivity","label":"Conectivitate","type":"multiselect","options":["USB-C","Bluetooth","2.4 GHz Wireless"]},
    {"key":"polling_rate_hz","label":"Polling rate (Hz)","type":"number"},
    {"key":"battery_life","label":"Autonomie baterie","type":"text"},
    {"key":"hot_swap","label":"Hot-swap","type":"boolean"},
    {"key":"rgb","label":"RGB","type":"boolean"},
    {"key":"keycap_material","label":"Material keycap","type":"text"}
  ]'::jsonb
),
(
  'Mouse-uri', 'mouse-uri', 2,
  '[
    {"key":"max_dpi","label":"DPI maxim","type":"number"},
    {"key":"buttons","label":"Butoane","type":"number"},
    {"key":"weight_grams","label":"Greutate (g)","type":"number"},
    {"key":"sensor","label":"Senzor","type":"text"},
    {"key":"connectivity","label":"Conectivitate","type":"multiselect","options":["USB-A","USB-C","Bluetooth","2.4 GHz Wireless"]},
    {"key":"polling_rate_hz","label":"Polling rate (Hz)","type":"number"}
  ]'::jsonb
),
(
  'Controllere', 'controllere', 3,
  '[
    {"key":"platform","label":"Platforme","type":"multiselect","options":["PC","Nintendo Switch","Android","iOS","macOS","PlayStation","Xbox"]},
    {"key":"connectivity","label":"Conectivitate","type":"multiselect","options":["Cablu USB-C","Bluetooth","2.4 GHz Wireless","Hyperlink"]},
    {"key":"battery_life_hours","label":"Autonomie baterie (ore)","type":"number"},
    {"key":"hall_effect","label":"Hall Effect","type":"boolean"},
    {"key":"back_paddles","label":"Padele spate","type":"number"},
    {"key":"rumble","label":"Vibratii","type":"boolean"}
  ]'::jsonb
),
(
  'Accesorii', 'accesorii', 4,
  '[
    {"key":"type","label":"Tip accesoriu","type":"text"},
    {"key":"compatibility","label":"Compatibilitate","type":"text"}
  ]'::jsonb
),
(
  'Volan Gaming', 'volan-gaming', 5,
  '[
    {"key":"degrees_rotation","label":"Grade rotatie","type":"number"},
    {"key":"force_feedback","label":"Force Feedback","type":"boolean"},
    {"key":"platform","label":"Platforme","type":"multiselect","options":["PC","PlayStation","Xbox"]},
    {"key":"pedals_included","label":"Pedale incluse","type":"boolean"}
  ]'::jsonb
)
on conflict (slug) do nothing;


-- 11. SEED: BRANDS
insert into brands (name, slug) values
  ('Epomaker', 'epomaker'),
  ('GuliKit',  'gulikit'),
  ('Keychron', 'keychron')
on conflict (slug) do nothing;


-- 12. STORAGE BUCKETS
-- Create these in Supabase Dashboard > Storage, or run in a separate SQL block:
--
--   insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
--   insert into storage.buckets (id, name, public) values ('product-videos', 'product-videos', true);
--
-- Storage RLS policies (also run separately):
--   create policy "public_read_product_images" on storage.objects
--     for select using (bucket_id = 'product-images');
--
--   create policy "admin_write_product_images" on storage.objects
--     for all using (
--       bucket_id in ('product-images', 'product-videos')
--       and exists (select 1 from public.admin_users where id = auth.uid())
--     );

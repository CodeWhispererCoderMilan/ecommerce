-- ==============================================================
-- MIGRATION 003: Homepage slots, promotions, brand/category extras
-- Run in Supabase SQL Editor
-- ==============================================================

-- 1. Extend brands table
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS photo_url   text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS hero_text   text;

-- 2. Extend categories table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS card_size text NOT NULL DEFAULT 'normal';

-- 3. Extend products table with badge-override flags
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS force_new   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disable_new boolean NOT NULL DEFAULT false;

-- 4. Homepage hero card (admin-configured brand showcase)
CREATE TABLE IF NOT EXISTS homepage_hero (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid REFERENCES brands(id) ON DELETE SET NULL,
  photo_url  text,
  headline   text NOT NULL DEFAULT '',
  subtext    text NOT NULL DEFAULT '',
  is_active  boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Homepage promo cards (2 small cards beneath hero)
CREATE TABLE IF NOT EXISTS homepage_promo_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot        int NOT NULL CHECK (slot IN (1, 2)),
  photo_url   text,
  button_text text NOT NULL DEFAULT 'Asta vreau',
  link_url    text NOT NULL DEFAULT '/produse',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slot)
);

-- 6. Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 7. Promotion items (product + discount)
CREATE TABLE IF NOT EXISTS promotion_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id   uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_pct   numeric(5,2),
  discount_price numeric(10,2),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

-- 8. RLS
ALTER TABLE homepage_hero        ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_promo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_items       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_homepage_hero"        ON homepage_hero        FOR SELECT USING (true);
CREATE POLICY "public_read_homepage_promo_cards" ON homepage_promo_cards FOR SELECT USING (true);
CREATE POLICY "public_read_promotions"           ON promotions           FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_promotion_items"      ON promotion_items      FOR SELECT USING (true);

CREATE POLICY "admin_all_homepage_hero"        ON homepage_hero        FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "admin_all_homepage_promo_cards" ON homepage_promo_cards FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "admin_all_promotions"           ON promotions           FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "admin_all_promotion_items"      ON promotion_items      FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- 9. Seed promo card slots so they always exist
INSERT INTO homepage_promo_cards (slot, button_text, link_url) VALUES
  (1, 'Asta vreau',   '/produse'),
  (2, 'E genu'' meu', '/produse')
ON CONFLICT (slot) DO NOTHING;

-- 10. Rebuild product_listing view with display_badge (auto-NOU logic)
DROP VIEW IF EXISTS product_listing;
CREATE VIEW product_listing AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.description,
  p.specs,
  p.base_price,
  p.badge,
  CASE
    WHEN p.force_new = true                                                           THEN 'NOU'
    WHEN p.badge IS NOT NULL                                                           THEN p.badge::text
    WHEN p.disable_new = false AND p.created_at > now() - interval '90 days'          THEN 'NOU'
    ELSE NULL
  END AS display_badge,
  p.force_new,
  p.disable_new,
  p.is_active,
  p.created_at,
  b.name  AS brand_name,
  b.slug  AS brand_slug,
  c.name  AS category_name,
  c.slug  AS category_slug,
  (
    SELECT display_url FROM product_images pi
    WHERE pi.product_id = p.id
      AND pi.variant_id IS NULL
      AND pi.is_primary = true
    LIMIT 1
  ) AS primary_image_url,
  EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.stock_quantity > 0
      AND pv.is_active = true
  ) AS in_stock,
  COALESCE(
    (
      SELECT min(pv.price)
      FROM product_variants pv
      WHERE pv.product_id = p.id
        AND pv.is_active = true
        AND pv.price IS NOT NULL
    ),
    p.base_price
  ) AS display_price
FROM products p
LEFT JOIN brands b     ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id;

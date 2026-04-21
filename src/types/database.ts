// ─────────────────────────────────────────────────────────────
// Database row types — keep in sync with supabase/migrations/
// ─────────────────────────────────────────────────────────────

export type Badge = "NOU" | "LIMITAT" | "PROMO";

// Spec field definition stored in categories.spec_fields
export interface SpecField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multiselect";
  options?: string[];
}

// Rich description block (stored in products.rich_description)
export type RichBlock =
  | { type: "heading"; content: string }
  | { type: "text"; content: string }
  | { type: "image"; url: string; alt?: string; caption?: string };

// Keyboard specs
export interface KeyboardSpecs {
  layout?: string;
  switch_type?: string;
  switch_brand?: string;
  hot_swap?: boolean;
  key_count?: number;
  keycap_material?: string;
  rgb?: boolean;
  wrist_rest?: boolean;
  rollover?: string;
  polling_rate_hz?: number;
  polling_rate_8k?: boolean;
  memory?: boolean;
  macro_keys?: boolean;
  low_profile?: boolean;
  multimedia_keys?: boolean;
  connectivity?: string[];
  battery_life?: string;
  connector?: string;
  cable_type?: string;
  cable_length?: string;
  detachable_cable?: boolean;
  software?: string;
  color?: string;
  material?: string;
}

// Mouse specs
export interface MouseSpecs {
  sensor?: string;
  sensor_type?: string;
  max_dpi?: number;
  adjustable_dpi?: boolean;
  tracking_speed_ips?: number;
  acceleration_g?: number;
  lod?: string;
  buttons?: number;
  weight_grams?: number;
  polling_rate_hz?: number;
  polling_rate_8k?: boolean;
  switch_buttons?: string;
  memory?: boolean;
  shape?: string;
  rgb?: boolean;
  grip?: string;
  connectivity?: string[];
  battery_life?: string;
  cable_type?: string;
  cable_length?: string;
  connector?: string;
}

// Controller specs
export interface ControllerSpecs {
  platform?: string[];
  connectivity?: string[];
  battery_life_hours?: number;
  hall_effect?: boolean;
  back_paddles?: number;
  rumble?: boolean;
}

// Wheel specs
export interface WheelSpecs {
  degrees_rotation?: number;
  force_feedback?: boolean;
  platform?: string[];
  pedals_included?: boolean;
}

// Accessory specs
export interface AccessorySpecs {
  type?: string;
  compatibility?: string;
  dimensions?: string;
  material?: string;
}

export type ProductSpecs =
  | KeyboardSpecs
  | MouseSpecs
  | ControllerSpecs
  | WheelSpecs
  | AccessorySpecs
  | Record<string, unknown>;

// ── Table row types ───────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  photo_url: string | null;
  card_size: "small" | "normal" | "large";
  spec_fields: SpecField[];
  sort_order: number;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  photo_url: string | null;
  description: string | null;
  hero_text: string | null;
  website: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  brand_id: string | null;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  highlights: string[];
  rich_description: RichBlock[];
  specs: ProductSpecs;
  base_price: number;
  badge: Badge | null;
  force_new: boolean;
  disable_new: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  storage_path: string;
  display_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text: string | null;
  created_at: string;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  storage_path: string;
  display_url: string;
  title: string | null;
  display_order: number;
  created_at: string;
}

// ── Joined / view types ───────────────────────────────────────

/** Row returned by the product_listing view — used for cards/grids */
export interface ProductListing {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specs: ProductSpecs;
  base_price: number;
  badge: Badge | null;
  display_badge: string | null;
  force_new: boolean;
  disable_new: boolean;
  is_active: boolean;
  created_at: string;
  brand_name: string | null;
  brand_slug: string | null;
  category_name: string | null;
  category_slug: string | null;
  primary_image_url: string | null;
  in_stock: boolean;
  display_price: number;
}

// ── Homepage / Promotions types ───────────────────────────────

export interface HomepageHero {
  id: string;
  brand_id: string | null;
  photo_url: string | null;
  headline: string;
  subtext: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  brand?: Brand | null;
}

export interface HomepagePromoCard {
  id: string;
  slot: 1 | 2;
  photo_url: string | null;
  button_text: string;
  link_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  ends_at: string | null;
  created_at: string;
}

export interface PromotionItem {
  id: string;
  promotion_id: string;
  product_id: string;
  discount_pct: number | null;
  discount_price: number | null;
  created_at: string;
  product?: ProductListing;
}

export interface BrandWithMeta extends Brand {
  max_discount: number | null;
  product_count: number;
}

/** Full product detail — product + variants + images + videos */
export interface ProductDetail extends Product {
  brand: Brand | null;
  category: Category | null;
  variants: (ProductVariant & { images: ProductImage[] })[];
  images: ProductImage[];  // product-level images (no variant)
  videos: ProductVideo[];
}

// ── Admin types ────────────────────────────────────────────────

/** Product row with joined brand + category for admin list */
export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  badge: Badge | null;
  is_active: boolean;
  created_at: string;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}

// ── Supabase Database type (for typed client) ─────────────────

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, "id" | "created_at">;
        Update: Partial<Omit<Brand, "id" | "created_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "created_at" | "updated_at">>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Omit<ProductVariant, "id" | "created_at">;
        Update: Partial<Omit<ProductVariant, "id" | "created_at">>;
      };
      product_images: {
        Row: ProductImage;
        Insert: Omit<ProductImage, "id" | "created_at">;
        Update: Partial<Omit<ProductImage, "id" | "created_at">>;
      };
      product_videos: {
        Row: ProductVideo;
        Insert: Omit<ProductVideo, "id" | "created_at">;
        Update: Partial<Omit<ProductVideo, "id" | "created_at">>;
      };
      admin_users: {
        Row: { id: string; created_at: string };
        Insert: { id: string };
        Update: never;
      };
    };
    Views: {
      product_listing: {
        Row: ProductListing;
      };
    };
  };
}

// Admin-only product operations.
// These rely on RLS: admin_users table grants full access to catalog tables.

import { supabase } from "@/lib/supabase";
import type { Brand, Category, AdminProductRow, ProductDetail, RichBlock, HomepageHero, HomepagePromoCard, Promotion, PromotionItem, ProductListing } from "@/types/database";

// ── Auth ─────────────────────────────────────────────────────

export async function getAdminStatus(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, userId: null };

  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return { isAdmin: !!data, userId: user.id };
}

// ── Lookups ───────────────────────────────────────────────────

export async function getAdminBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getAdminCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

// ── Product list ──────────────────────────────────────────────

export async function getAllProductsAdmin(): Promise<AdminProductRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select("id, name, slug, base_price, badge, is_active, created_at, brand:brands(name,slug), category:categories(name,slug)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Product detail ────────────────────────────────────────────

export async function getProductAdminById(id: string): Promise<ProductDetail | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("products")
    .select(`
      *,
      brand:brands(*),
      category:categories(*),
      images:product_images!product_id(*),
      variants:product_variants(*, images:product_images!variant_id(*))
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const p = data as ProductDetail;
  if (p.images) {
    p.images = p.images
      .filter((img) => img.variant_id === null)
      .sort((a, b) => a.display_order - b.display_order);
  }
  if (p.variants) {
    p.variants = p.variants
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        ...v,
        images: (v.images ?? []).sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order),
      }));
  }
  return p;
}

// ── CRUD ──────────────────────────────────────────────────────

export interface ProductSaveData {
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  description: string;
  highlights: string[];
  rich_description: RichBlock[];
  specs: Record<string, unknown>;
  base_price: number;
  badge: string | null;
  is_active: boolean;
}

export async function createProductAdmin(data: ProductSaveData): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .insert(data)
    .select("id")
    .single();
  if (error) throw error;
  return product.id as string;
}

export async function updateProductAdmin(id: string, data: Partial<ProductSaveData>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .update(data)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProductAdmin(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("products")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Variants ──────────────────────────────────────────────────

export interface VariantInput {
  id?: string;  // existing variant
  name: string;
  sku: string;
  price: number | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
}

export async function upsertVariants(productId: string, variants: VariantInput[]): Promise<void> {
  for (const v of variants) {
    if (v.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("product_variants")
        .update({ name: v.name, sku: v.sku || null, price: v.price, stock_quantity: v.stock_quantity, is_active: v.is_active, sort_order: v.sort_order })
        .eq("id", v.id);
      if (error) throw error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("product_variants")
        .insert({ product_id: productId, name: v.name, sku: v.sku || null, price: v.price, stock_quantity: v.stock_quantity, is_active: v.is_active, sort_order: v.sort_order });
      if (error) throw error;
    }
  }
}

export async function deleteVariant(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("product_variants")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ── Images ────────────────────────────────────────────────────

export async function uploadAndSaveImage(opts: {
  file: File;
  productId: string;
  productSlug: string;
  isPrimary: boolean;
  displayOrder: number;
  altText?: string;
}): Promise<string> {
  const ext = opts.file.name.split(".").pop();
  const path = `${opts.productSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(path, opts.file, { upsert: false });
  if (upErr) throw upErr;

  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any).from("product_images").insert({
    product_id:    opts.productId,
    variant_id:    null,
    storage_path:  path,
    display_url:   publicUrl,
    is_primary:    opts.isPrimary,
    display_order: opts.displayOrder,
    alt_text:      opts.altText ?? null,
  });
  if (dbErr) throw dbErr;

  return publicUrl;
}

export async function deleteProductImage(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("product-images").remove([storagePath]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("product_images").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadDescriptionImage(file: File, productSlug: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${productSlug}/desc-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
  return publicUrl;
}

// ── Brands admin ──────────────────────────────────────────────

export async function updateBrandAdmin(id: string, data: Partial<Pick<Brand, "name" | "slug" | "logo_url" | "photo_url" | "description" | "hero_text" | "website">>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("brands").update(data).eq("id", id);
  if (error) throw error;
}

export async function uploadBrandPhoto(brandSlug: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `brands/${brandSlug}/photo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
  return publicUrl;
}

// ── Categories admin ──────────────────────────────────────────

export async function updateCategoryAdmin(id: string, data: Partial<Pick<Category, "photo_url" | "card_size" | "description">>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("categories").update(data).eq("id", id);
  if (error) throw error;
}

export async function uploadCategoryPhoto(categorySlug: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `categories/${categorySlug}/photo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
  return publicUrl;
}

// ── Homepage admin ─────────────────────────────────────────────

export async function getHomepageHeroes(): Promise<HomepageHero[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("homepage_hero")
    .select("*, brand:brands(*)")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function upsertHomepageHero(hero: Partial<HomepageHero> & { id?: string }): Promise<string> {
  if (hero.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("homepage_hero").update(hero).eq("id", hero.id);
    if (error) throw error;
    return hero.id;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("homepage_hero").insert(hero).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function deleteHomepageHero(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("homepage_hero").delete().eq("id", id);
  if (error) throw error;
}

export async function getHomepagePromoCards(): Promise<HomepagePromoCard[]> {
  const { data, error } = await supabase.from("homepage_promo_cards").select("*").order("slot");
  if (error) throw error;
  return (data ?? []) as HomepagePromoCard[];
}

export async function updateHomepagePromoCard(slot: 1 | 2, data: Partial<HomepagePromoCard>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("homepage_promo_cards").update(data).eq("slot", slot);
  if (error) throw error;
}

export async function uploadHomepagePhoto(prefix: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `homepage/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
  return publicUrl;
}

// ── Promotions admin ──────────────────────────────────────────

export async function getAllPromotionsAdmin(): Promise<Promotion[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPromotionAdmin(data: { title: string; slug: string; description: string; ends_at: string | null }): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: promo, error } = await (supabase as any).from("promotions").insert(data).select("id").single();
  if (error) throw error;
  return promo.id;
}

export async function updatePromotionAdmin(id: string, data: Partial<Promotion>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("promotions").update(data).eq("id", id);
  if (error) throw error;
}

export async function deletePromotionAdmin(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("promotions").delete().eq("id", id);
  if (error) throw error;
}

export async function getPromotionItemsAdmin(promotionId: string): Promise<(PromotionItem & { product: ProductListing })[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("promotion_items")
    .select("*, product:product_listing(*)")
    .eq("promotion_id", promotionId);
  if (error) throw error;
  return data ?? [];
}

export async function addPromotionItem(promotionId: string, productId: string, discountPct: number | null, discountPrice: number | null): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("promotion_items").insert({
    promotion_id: promotionId,
    product_id: productId,
    discount_pct: discountPct,
    discount_price: discountPrice,
  });
  if (error) throw error;
}

export async function removePromotionItem(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("promotion_items").delete().eq("id", id);
  if (error) throw error;
}

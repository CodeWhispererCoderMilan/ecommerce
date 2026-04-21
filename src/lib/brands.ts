import { supabase } from "@/lib/supabase";
import type { Brand, BrandWithMeta } from "@/types/database";

export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("brands").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Brand | null;
}

/** Brands with max discount from active promotions and product count — for homepage brand bar */
export async function getHomepageBrands(): Promise<BrandWithMeta[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brands, error } = await (supabase as any).from("brands").select("*").order("name");
  if (error || !brands?.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from("promotion_items")
    .select("discount_pct, product:products(brand_id)")
    .not("discount_pct", "is", null);

  const brandDiscounts: Record<string, number> = {};
  for (const item of (items ?? []) as Array<{ discount_pct: number; product: { brand_id: string } }>) {
    const brandId = item.product?.brand_id;
    if (brandId && item.discount_pct) {
      brandDiscounts[brandId] = Math.max(brandDiscounts[brandId] ?? 0, item.discount_pct);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: counts } = await (supabase as any)
    .from("products")
    .select("brand_id")
    .eq("is_active", true);

  const brandCounts: Record<string, number> = {};
  for (const p of (counts ?? []) as Array<{ brand_id: string | null }>) {
    if (p.brand_id) brandCounts[p.brand_id] = (brandCounts[p.brand_id] ?? 0) + 1;
  }

  return (brands as Brand[]).map((b) => ({
    ...b,
    max_discount: brandDiscounts[b.id] ?? null,
    product_count: brandCounts[b.id] ?? 0,
  }));
}

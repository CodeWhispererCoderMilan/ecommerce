import { supabase } from "@/lib/supabase";
import type { Promotion, PromotionItem } from "@/types/database";

export async function getActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPromotionBySlug(slug: string): Promise<Promotion | null> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPromotionItems(promotionId: string): Promise<PromotionItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("promotion_items")
    .select(`*, product:product_listing(*)`)
    .eq("promotion_id", promotionId);
  if (error) throw error;
  return data ?? [];
}

/** Get new products via display_badge (auto-NOU from view) */
export async function getNewProducts(limit = 12): Promise<import("@/types/database").ProductListing[]> {
  const { data, error } = await supabase
    .from("product_listing")
    .select("*")
    .eq("is_active", true)
    .eq("display_badge", "NOU")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

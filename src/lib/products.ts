import { supabase } from "@/lib/supabase";
import type { Database, ProductDetail, ProductListing } from "@/types/database";

// ── Listing queries (for cards / grids) ───────────────────────

export type SortOption = "popular" | "newest" | "price_asc" | "price_desc";

export interface ProductFilter {
  categorySlug?: string;
  brandSlug?: string;
  /** tip = mecanica | magnetica | membrana | 8k | simplu | mousepad | switch etc. */
  tip?: string;
  hot_swap?: boolean;
  platforma?: string;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

/** All active products with optional filtering */
export async function getProducts(opts: ProductFilter = {}): Promise<{ products: ProductListing[]; total: number }> {
  let query = supabase
    .from("product_listing")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (opts.categorySlug) {
    // Support comma-separated categories: "tastaturi,mouse-uri"
    const cats = opts.categorySlug.split(",").map((s) => s.trim());
    if (cats.length === 1) {
      query = query.eq("category_slug", cats[0]);
    } else {
      query = query.in("category_slug", cats);
    }
  }
  if (opts.brandSlug) query = query.eq("brand_slug", opts.brandSlug);

  switch (opts.sort) {
    case "price_asc":  query = query.order("display_price", { ascending: true });  break;
    case "price_desc": query = query.order("display_price", { ascending: false }); break;
    case "newest":     query = query.order("created_at",    { ascending: false }); break;
    default:           query = query.order("created_at",    { ascending: false }); break;
  }

  if (opts.limit)  query = query.limit(opts.limit);
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 24) - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  let products = (data ?? []) as ProductListing[];

  // Client-side JSONB spec filtering (catalog is small enough)
  if (opts.tip) {
    const tip = opts.tip.toLowerCase();
    products = products.filter((p) => {
      const specs = p.specs as Record<string, unknown>;
      switch (tip) {
        case "magnetica":
          return String(specs.switch_type ?? "").toLowerCase().includes("magnet")
            || String(specs.switch_type ?? "").toLowerCase().includes("tmr")
            || String(specs.switch_type ?? "").toLowerCase().includes("hall");
        case "mecanica":
          return !String(specs.switch_type ?? "").toLowerCase().includes("magnet")
            && !String(specs.switch_type ?? "").toLowerCase().includes("tmr")
            && !String(specs.switch_type ?? "").toLowerCase().includes("hall")
            && !String(specs.switch_type ?? "").toLowerCase().includes("scissor")
            && !!specs.switch_type;
        case "membrana":
          return String(specs.switch_type ?? "").toLowerCase().includes("scissor")
            || String(specs.switch_type ?? "").toLowerCase().includes("membran");
        case "8k":
          return specs.polling_rate_8k === true;
        case "simplu":
          return specs.polling_rate_8k !== true;
        case "mousepad":
          return String(p.name).toLowerCase().includes("mousepad")
            || String(p.name).toLowerCase().includes("mouse pad");
        case "switch":
          return String(p.name).toLowerCase().includes("switch");
        case "folie":
          return String(p.name).toLowerCase().includes("folie");
        case "husa":
          return String(p.name).toLowerCase().includes("husa")
            || String(p.name).toLowerCase().includes("vault case")
            || String(p.name).toLowerCase().includes("huse");
        case "stand":
          return String(p.name).toLowerCase().includes("stand")
            || String(p.name).toLowerCase().includes("incarc");
        default:
          return true;
      }
    });
  }

  if (opts.hot_swap === true) {
    products = products.filter((p) => (p.specs as Record<string, unknown>).hot_swap === true);
  }

  if (opts.platforma) {
    const plat = opts.platforma.toLowerCase();
    products = products.filter((p) => {
      const specs = p.specs as Record<string, unknown>;
      const platforms = (specs.platform as string[] | undefined) ?? [];
      const connectivity = (specs.connectivity as string[] | undefined) ?? [];
      const name = p.name.toLowerCase();
      switch (plat) {
        case "playstation": return platforms.some((x) => x.toLowerCase().includes("play")) || name.includes("ps5") || name.includes("ps4");
        case "xbox":        return platforms.some((x) => x.toLowerCase().includes("xbox")) || name.includes("xbox");
        case "switch":      return platforms.some((x) => x.toLowerCase().includes("switch")) || name.includes("switch");
        case "pc-switch":   return platforms.some((x) => x.toLowerCase().includes("pc") || x.toLowerCase().includes("switch"));
        case "multi":       return platforms.length >= 3;
        case "pc":          return platforms.some((x) => x.toLowerCase().includes("pc")) || name.includes("pc");
        default:            return true;
      }
    });
  }

  return { products, total: count ?? products.length };
}

/** Products with a specific badge, e.g. 'NOU' */
export async function getProductsByBadge(
  badge: "NOU" | "LIMITAT" | "PROMO",
  limit = 8,
): Promise<ProductListing[]> {
  const { data, error } = await supabase
    .from("product_listing")
    .select("*")
    .eq("badge", badge)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Latest products (for "Ultimele apariții" section) */
export async function getLatestProducts(limit = 6): Promise<ProductListing[]> {
  const { data, error } = await supabase
    .from("product_listing")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ── Detail query (for product page) ──────────────────────────

/** Full product detail by slug, including variants and images */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data: product, error: pErr } = await supabase
    .from("products")
    .select(`
      *,
      brand:brands(*),
      category:categories(*),
      images:product_images!product_id(*),
      videos:product_videos(*),
      variants:product_variants(
        *,
        images:product_images!variant_id(*)
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (pErr) {
    if (pErr.code === "PGRST116") return null;
    throw pErr;
  }

  // Sort and filter in JS — Supabase JS doesn't support inline ordering on relations
  const p = product as unknown as ProductDetail;

  if (p.images) {
    p.images = p.images
      .filter((img) => img.variant_id === null)
      .sort((a, b) => a.display_order - b.display_order);
  }
  if (p.variants) {
    p.variants = p.variants
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        ...v,
        images: (v.images ?? []).sort((a, b) => a.display_order - b.display_order),
      }));
  }
  if (p.videos) {
    p.videos = p.videos.sort((a, b) => a.display_order - b.display_order);
  }

  return p;
}

/** Related products in the same category, excluding current */
export async function getRelatedProducts(
  categorySlug: string,
  excludeSlug: string,
  limit = 4,
): Promise<ProductListing[]> {
  const { data, error } = await supabase
    .from("product_listing")
    .select("*")
    .eq("category_slug", categorySlug)
    .neq("slug", excludeSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ── Admin queries (require admin session) ────────────────────

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export async function createProduct(data: ProductInsert) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return product;
}

export async function updateProduct(id: string, data: ProductUpdate) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return product;
}

/** Upload a product image to Supabase Storage and record it in the DB */
export async function uploadProductImage(opts: {
  file: File;
  productId: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  isPrimary?: boolean;
  altText?: string;
}): Promise<void> {
  const ext = opts.file.name.split(".").pop();
  const folder = opts.variantName
    ? `${opts.productSlug}/${opts.variantName.toLowerCase()}`
    : opts.productSlug;
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(path, opts.file, { upsert: false });
  if (upErr) throw upErr;

  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase as any).from("product_images").insert({
    product_id:    opts.productId,
    variant_id:    opts.variantId ?? null,
    storage_path:  path,
    display_url:   publicUrl,
    is_primary:    opts.isPrimary ?? false,
    alt_text:      opts.altText ?? null,
  });
  if (dbErr) throw dbErr;
}

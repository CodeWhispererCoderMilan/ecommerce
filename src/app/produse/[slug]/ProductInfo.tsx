"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { ProductDetail } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface Props {
  product: ProductDetail;
}

export default function ProductInfo({ product }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data } = await supabase.from("admin_users").select("id").eq("id", session.user.id).maybeSingle();
      setIsAdmin(!!data);
    });
  }, []);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const price = selectedVariant?.price ?? product.base_price;
  const inStock = selectedVariant ? selectedVariant.stock_quantity > 0 : true;

  const priceStr = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  // Expose add-btn ref so StickyBar can use IntersectionObserver
  useEffect(() => {
    if (addBtnRef.current) {
      addBtnRef.current.id = "add-to-cart-anchor";
    }
  }, []);

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // Cart logic goes here when cart is implemented
  }

  const specs = product.specs as Record<string, unknown>;

  // Build quick-spec pills from known spec fields
  const quickSpecs: { label: string; value: string }[] = [];
  if (specs.switch_type) quickSpecs.push({ label: "Switch", value: String(specs.switch_type) });
  if (specs.layout)      quickSpecs.push({ label: "Layout", value: String(specs.layout) });
  if (specs.connectivity && Array.isArray(specs.connectivity))
    quickSpecs.push({ label: "Conectivitate", value: (specs.connectivity as string[]).join(" · ") });
  if (specs.hot_swap !== undefined)
    quickSpecs.push({ label: "Hot-Swap", value: specs.hot_swap ? "DA" : "NU" });
  if (specs.hall_effect !== undefined)
    quickSpecs.push({ label: "Hall Effect", value: specs.hall_effect ? "DA" : "NU" });
  if (specs.max_dpi)     quickSpecs.push({ label: "DPI", value: String(specs.max_dpi) });
  if (specs.weight_grams) quickSpecs.push({ label: "Greutate", value: `${specs.weight_grams}g` });
  if (specs.platform && Array.isArray(specs.platform))
    quickSpecs.push({ label: "Platforme", value: (specs.platform as string[]).join(" · ") });

  return (
    <div className="flex flex-col">
      {/* Badge + category breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        {product.badge && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-white ${
            product.badge === "NOU" ? "bg-blue-600" :
            product.badge === "LIMITAT" ? "bg-red-600" : "bg-green-600"
          }`}>
            {product.badge}
          </span>
        )}
        {product.category && (
          <a
            href={`/produse?categorie=${product.category.slug}`}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            {product.category.name}
          </a>
        )}
        {product.brand && (
          <>
            <span className="text-zinc-300 text-xs">·</span>
            <a
              href={`/produse?brand=${product.brand.slug}`}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {product.brand.name}
            </a>
          </>
        )}
      </div>

      {/* Product name */}
      <div className="flex items-start gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 leading-tight flex-1">
          {product.name}
        </h1>
        {isAdmin && (
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors mt-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editează
          </Link>
        )}
      </div>

      {/* SKU */}
      {product.sku && (
        <p className="text-[11px] text-zinc-400 -mt-2 mb-4">
          SKU: <span className="font-mono">{product.sku}</span>
        </p>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-black text-zinc-900">
          {priceStr} <span className="text-xl font-semibold">RON</span>
        </span>
        {price === 0 && (
          <span className="text-sm text-zinc-400">Preț la cerere</span>
        )}
      </div>

      {/* Quick spec pills */}
      {quickSpecs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {quickSpecs.map((s) => (
            <span
              key={s.label}
              className="text-[11px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full border border-zinc-200"
            >
              <span className="font-semibold text-zinc-800">{s.label}:</span> {s.value}
            </span>
          ))}
        </div>
      )}

      {/* Variant picker */}
      {product.variants.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Variantă
            {selectedVariant && (
              <span className="ml-1 font-normal normal-case text-zinc-700">
                — {selectedVariant.name}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={v.stock_quantity === 0}
                onClick={() => setSelectedVariantId(v.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  v.id === selectedVariantId
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : v.stock_quantity === 0
                    ? "border-zinc-200 text-zinc-300 cursor-not-allowed line-through"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-500"
                }`}
              >
                {v.name}
                {v.stock_quantity === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-px bg-zinc-300 absolute rotate-12" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock indicator */}
      <div className="flex items-center gap-1.5 mb-5">
        <span className={`w-2 h-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-400"}`} />
        <span className={`text-xs font-semibold ${inStock ? "text-green-700" : "text-red-500"}`}>
          {inStock ? "În stoc — livrare în 1-3 zile lucrătoare" : "Stoc epuizat"}
        </span>
      </div>

      {/* Quantity + Add to cart */}
      <div className="flex gap-2 mb-4">
        <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors text-lg font-light"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold text-zinc-900">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-12 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors text-lg font-light"
          >
            +
          </button>
        </div>
        <button
          ref={addBtnRef}
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`flex-1 h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
            added
              ? "bg-green-600 text-white"
              : inStock
              ? "bg-zinc-900 hover:bg-zinc-700 text-white"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {added ? "✓ Adăugat în coș" : inStock ? `Adaugă în coș · ${priceStr} RON` : "Stoc epuizat"}
        </button>
      </div>

      {/* Trust pills */}
      <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-zinc-100">
        {[
          { icon: "🔄", text: "Returnare 30 zile" },
          { icon: "🚀", text: "Expediere azi" },
          { icon: "💳", text: "Rate fără dobândă" },
          { icon: "🛡️", text: "Garanție 2 ani" },
        ].map((t) => (
          <span key={t.text} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>{t.icon}</span>
            <span>{t.text}</span>
          </span>
        ))}
      </div>

      {/* Short description */}
      {product.description && (
        <p className="text-sm text-zinc-600 leading-relaxed mb-5">
          {product.description.slice(0, 300)}
          {product.description.length > 300 && "…"}
        </p>
      )}

      {/* Highlights — use explicit highlights field if set, else fall back to quickSpecs */}
      {(product.highlights?.length > 0 || quickSpecs.length > 0) && (
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-3">
            Highlights:
          </p>
          <ul className="space-y-1.5">
            {product.highlights?.length > 0
              ? product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                    <span>{h}</span>
                  </li>
                ))
              : quickSpecs.map((s) => (
                  <li key={s.label} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                    <span><span className="font-semibold">{s.label}:</span> {s.value}</span>
                  </li>
                ))
            }
          </ul>
        </div>
      )}
    </div>
  );
}

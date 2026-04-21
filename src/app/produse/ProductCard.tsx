"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductListing } from "@/types/database";

interface Props {
  product: ProductListing;
}

const BADGE_STYLE: Record<string, string> = {
  NOU:     "bg-blue-600 text-white",
  LIMITAT: "bg-red-600 text-white",
  PROMO:   "bg-green-600 text-white",
};

export default function ProductCard({ product: p }: Props) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const priceStr = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
  }).format(p.display_price);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link
      href={`/produse/${p.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        {p.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.primary_image_url}
            alt={p.name}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Placeholder gradient */
          <div className="w-full h-full flex items-center justify-center">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Badge */}
        {p.badge && (
          <span className={`absolute top-2.5 left-2.5 text-[10px] font-black uppercase px-2 py-0.5 rounded ${BADGE_STYLE[p.badge] ?? "bg-zinc-700 text-white"}`}>
            {p.badge}
          </span>
        )}

        {/* Hover "Add to cart" button */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-200 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
          <button
            onClick={handleAdd}
            disabled={!p.in_stock}
            className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              added
                ? "bg-green-600 text-white"
                : p.in_stock
                ? "bg-zinc-900 hover:bg-zinc-700 text-white"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {added ? "✓ Adăugat" : p.in_stock ? "Adaugă în coș" : "Stoc epuizat"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {p.brand_name && (
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            {p.brand_name}
          </p>
        )}
        <p className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2 flex-1 mb-3">
          {p.name}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-base font-black text-zinc-900">
              {p.display_price > 0 ? `${priceStr} RON` : "Preț la cerere"}
            </p>
            <p className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${p.in_stock ? "text-green-600" : "text-red-500"}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${p.in_stock ? "bg-green-500" : "bg-red-400"}`} />
              {p.in_stock ? "În stoc" : "Stoc epuizat"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

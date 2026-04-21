"use client";

import { useEffect, useState } from "react";
import type { ProductDetail } from "@/types/database";

interface Props {
  product: ProductDetail;
}

export default function StickyBar({ product }: Props) {
  const [visible, setVisible] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = product.variants[0]?.price ?? product.base_price;
  const priceStr = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
  }).format(price * qty);

  const primaryImage =
    product.images[0]?.display_url ??
    product.variants[0]?.images[0]?.display_url ??
    null;

  useEffect(() => {
    function check() {
      const anchor = document.getElementById("add-to-cart-anchor");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setVisible(rect.bottom < 0);
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, []);

  function handleAdd() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Thumbnail */}
        {primaryImage && (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 hidden sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Name */}
        <p className="flex-1 text-sm font-semibold text-zinc-900 truncate hidden md:block">
          {product.name}
        </p>

        {/* Qty */}
        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden h-9">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            +
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          className={`h-10 px-6 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shrink-0 ${
            added
              ? "bg-green-600 text-white"
              : "bg-zinc-900 hover:bg-zinc-700 text-white"
          }`}
        >
          {added ? "✓ Adăugat" : `Adaugă · ${priceStr} RON`}
        </button>
      </div>
    </div>
  );
}

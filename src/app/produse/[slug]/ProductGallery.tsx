"use client";

import { useState } from "react";
import type { ProductImage, ProductVariant } from "@/types/database";

interface Props {
  productImages: ProductImage[];
  variants: (ProductVariant & { images: ProductImage[] })[];
  productName: string;
}

export default function ProductGallery({ productImages, variants, productName }: Props) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const variantImages =
    variants.find((v) => v.id === activeVariantId)?.images ?? [];
  const allImages = variantImages.length > 0 ? variantImages : productImages;

  const active = allImages[activeIdx] ?? null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnail strip */}
      <div className="flex flex-col gap-2 w-16 shrink-0">
        {allImages.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActiveIdx(i)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
              i === activeIdx
                ? "border-zinc-900"
                : "border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.display_url}
              alt={img.alt_text ?? `${productName} ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="flex-1 min-w-0">
        <div
          className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 cursor-zoom-in select-none`}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          {active ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.display_url}
                alt={active.alt_text ?? productName}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {zoomed && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `url(${active.display_url})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d4d4d8"
                strokeWidth="1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Arrow navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => (i - 1 + allImages.length) % allImages.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors z-10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => setActiveIdx((i) => (i + 1) % allImages.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-colors z-10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`rounded-full transition-all ${
                    i === activeIdx ? "w-4 h-1.5 bg-zinc-900" : "w-1.5 h-1.5 bg-zinc-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Variant selector below image (if variants have different images) */}
        {variants.length > 1 && variants.some((v) => v.images.length > 0) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { setActiveVariantId(v.id); setActiveIdx(0); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  v.id === activeVariantId
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 text-zinc-600 hover:border-zinc-500"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

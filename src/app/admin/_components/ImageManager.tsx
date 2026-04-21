"use client";

import { useRef, useState } from "react";
import type { ProductImage } from "@/types/database";
import { deleteProductImage } from "@/lib/admin";

export interface PendingImage {
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface Props {
  existingImages: ProductImage[];
  pendingImages: PendingImage[];
  onExistingChange: (images: ProductImage[]) => void;
  onPendingChange: (images: PendingImage[]) => void;
}

export default function ImageManager({
  existingImages,
  pendingImages,
  onExistingChange,
  onPendingChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(img: ProductImage) {
    if (!confirm("Ștergi această imagine?")) return;
    setDeletingId(img.id);
    try {
      await deleteProductImage(img.id, img.storage_path);
      onExistingChange(existingImages.filter((i) => i.id !== img.id));
    } catch (err) {
      alert("Eroare: " + String(err));
    } finally {
      setDeletingId(null);
    }
  }

  function setPrimary(img: ProductImage) {
    onExistingChange(
      existingImages.map((i) => ({ ...i, is_primary: i.id === img.id }))
    );
  }

  function addPending(files: FileList) {
    const newImgs: PendingImage[] = Array.from(files).map((f, idx) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      isPrimary: existingImages.length === 0 && pendingImages.length === 0 && idx === 0,
    }));
    onPendingChange([...pendingImages, ...newImgs]);
  }

  function removePending(idx: number) {
    URL.revokeObjectURL(pendingImages[idx].previewUrl);
    onPendingChange(pendingImages.filter((_, i) => i !== idx));
  }

  function setPendingPrimary(idx: number) {
    onPendingChange(pendingImages.map((p, i) => ({ ...p, isPrimary: i === idx })));
    // Also clear primary on existing
    onExistingChange(existingImages.map((i) => ({ ...i, is_primary: false })));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing saved images */}
        {existingImages.map((img) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border-2 border-zinc-200 aspect-square bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.display_url} alt={img.alt_text ?? ""} className="w-full h-full object-contain p-2" />
            {img.is_primary && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                Principal
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1 pb-2">
              {!img.is_primary && (
                <button type="button" onClick={() => setPrimary(img)}
                  className="text-[9px] px-2 py-1 bg-blue-600 text-white rounded font-bold">
                  Principal
                </button>
              )}
              <button type="button" onClick={() => handleDelete(img)} disabled={deletingId === img.id}
                className="text-[9px] px-2 py-1 bg-red-600 text-white rounded font-bold disabled:opacity-50">
                {deletingId === img.id ? "…" : "Șterge"}
              </button>
            </div>
          </div>
        ))}

        {/* Pending (not yet uploaded) images */}
        {pendingImages.map((img, idx) => (
          <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-dashed border-blue-300 aspect-square bg-blue-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.previewUrl} alt="" className="w-full h-full object-contain p-2" />
            <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
              Nou
            </span>
            {img.isPrimary && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                Principal
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1 pb-2">
              {!img.isPrimary && (
                <button type="button" onClick={() => setPendingPrimary(idx)}
                  className="text-[9px] px-2 py-1 bg-blue-600 text-white rounded font-bold">
                  Principal
                </button>
              )}
              <button type="button" onClick={() => removePending(idx)}
                className="text-[9px] px-2 py-1 bg-red-600 text-white rounded font-bold">
                Scoate
              </button>
            </div>
          </div>
        ))}

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className="text-xs font-semibold">Adaugă imagini</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addPending(e.target.files)}
      />

      <p className="text-xs text-zinc-400">
        Prima imagine marcată ca „Principal" va apărea în listinguri. Celelalte imaginile vor fi afișate în galeria produsului.
        <br />Imaginile <span className="text-orange-600 font-semibold">portocalii (Nou)</span> vor fi încărcate când salvezi produsul.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getAdminCategories, updateCategoryAdmin, uploadCategoryPhoto } from "@/lib/admin";
import type { Category } from "@/types/database";

const SIZE_OPTIONS: { value: Category["card_size"]; label: string }[] = [
  { value: "small",  label: "Mic" },
  { value: "normal", label: "Normal" },
  { value: "large",  label: "Mare (2×2)" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    getAdminCategories().then(setCategories).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handlePhotoUpload(cat: Category, file: File) {
    setSaving(cat.id);
    try {
      const url = await uploadCategoryPhoto(cat.slug, file);
      await updateCategoryAdmin(cat.id, { photo_url: url });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, photo_url: url } : c));
    } catch (e) { alert(String(e)); }
    finally { setSaving(null); }
  }

  async function handleSizeChange(cat: Category, size: Category["card_size"]) {
    setSaving(cat.id);
    try {
      await updateCategoryAdmin(cat.id, { card_size: size });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, card_size: size } : c));
    } catch (e) { alert(String(e)); }
    finally { setSaving(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">Categorii</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Setează fotografii și dimensiunile cardurilor pentru homepage.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-center gap-4">
                {/* Photo preview */}
                <div className="shrink-0">
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-zinc-100">
                    {cat.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cat.photo_url} alt={cat.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs text-center px-1">Fără foto</div>
                    }
                  </div>
                  <label className="mt-2 block cursor-pointer">
                    <span className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                      {saving === cat.id ? "Se încarcă…" : "Schimbă foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={saving === cat.id}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(cat, f); }}
                    />
                  </label>
                </div>

                {/* Info + size picker */}
                <div className="flex-1">
                  <h2 className="text-lg font-black text-zinc-900">{cat.name}</h2>
                  <p className="text-xs text-zinc-400 mb-3">/{cat.slug} · ord. {cat.sort_order}</p>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Dimensiune card (homepage)</p>
                    <div className="flex gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleSizeChange(cat, opt.value)}
                          disabled={saving === cat.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                            cat.card_size === opt.value
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

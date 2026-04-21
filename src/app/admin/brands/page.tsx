"use client";

import { useEffect, useState } from "react";
import { getAdminBrands, updateBrandAdmin, uploadBrandPhoto } from "@/lib/admin";
import type { Brand } from "@/types/database";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Brand>>({});

  useEffect(() => {
    getAdminBrands().then(setBrands).catch(console.error).finally(() => setLoading(false));
  }, []);

  function startEdit(b: Brand) {
    setEditing(b.id);
    setForm({ description: b.description ?? "", hero_text: b.hero_text ?? "", website: b.website ?? "" });
  }

  async function saveText(b: Brand) {
    setSaving(b.id);
    try {
      await updateBrandAdmin(b.id, { description: form.description ?? null, hero_text: form.hero_text ?? null, website: form.website ?? null });
      setBrands((prev) => prev.map((x) => x.id === b.id ? { ...x, ...form } : x));
      setEditing(null);
    } catch (e) { alert(String(e)); }
    finally { setSaving(null); }
  }

  async function handlePhoto(b: Brand, file: File) {
    setSaving(b.id);
    try {
      const url = await uploadBrandPhoto(b.slug, file);
      await updateBrandAdmin(b.id, { photo_url: url });
      setBrands((prev) => prev.map((x) => x.id === b.id ? { ...x, photo_url: url } : x));
    } catch (e) { alert(String(e)); }
    finally { setSaving(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">Branduri</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Editează fotografii, descrieri și text pentru fiecare brand.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {brands.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="shrink-0">
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-zinc-100 relative">
                    {b.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs text-center px-1">Fără foto</div>
                    }
                  </div>
                  <label className="mt-2 block cursor-pointer">
                    <span className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                      {saving === b.id ? "Se încarcă…" : "Schimbă foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={saving === b.id}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(b, f); }}
                    />
                  </label>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900">{b.name}</h2>
                      <p className="text-xs text-zinc-400">/{b.slug}</p>
                    </div>
                    {editing === b.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(null)} className="text-xs text-zinc-400 hover:text-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-200">Anulează</button>
                        <button onClick={() => saveText(b)} disabled={saving === b.id} className="text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-700 px-3 py-1.5 rounded-lg disabled:opacity-50">
                          {saving === b.id ? "Se salvează…" : "Salvează"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(b)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-400">
                        Editează
                      </button>
                    )}
                  </div>

                  {editing === b.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Descriere (pagina brandului)</label>
                        <textarea
                          value={form.description ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3}
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
                          placeholder="Descriere scurtă a brandului…"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Text hero (carddul mare pe homepage)</label>
                        <input
                          type="text"
                          value={form.hero_text ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, hero_text: e.target.value }))}
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400"
                          placeholder="ex: Performanță la cel mai înalt nivel"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Website</label>
                        <input
                          type="url"
                          value={form.website ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400"
                          placeholder="https://brand.com"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-zinc-500"><span className="font-semibold text-zinc-700">Descriere:</span> {b.description || <span className="italic text-zinc-400">nesetată</span>}</p>
                      <p className="text-xs text-zinc-500"><span className="font-semibold text-zinc-700">Hero text:</span> {b.hero_text || <span className="italic text-zinc-400">nesetat</span>}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

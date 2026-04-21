"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllPromotionsAdmin, createPromotionAdmin, updatePromotionAdmin, deletePromotionAdmin,
  getPromotionItemsAdmin, addPromotionItem, removePromotionItem, getAllProductsAdmin,
} from "@/lib/admin";
import type { Promotion, PromotionItem, AdminProductRow, ProductListing } from "@/types/database";

function slugify(t: string) {
  return t.toLowerCase().replace(/[ăâ]/g, "a").replace(/[îí]/g, "i").replace(/ș/g, "s").replace(/ț/g, "t")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [items, setItems]           = useState<Record<string, (PromotionItem & { product: ProductListing })[]>>({});
  const [allProducts, setAllProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // New promo form
  const [newTitle, setNewTitle]   = useState("");
  const [newDesc, setNewDesc]     = useState("");
  const [newEndsAt, setNewEndsAt] = useState("");

  // Add product to promo
  const [addProductId, setAddProductId] = useState("");
  const [addDiscountPct, setAddDiscountPct] = useState("");
  const [addDiscountPrice, setAddDiscountPrice] = useState("");

  const loadItems = useCallback(async (promoId: string) => {
    const data = await getPromotionItemsAdmin(promoId);
    setItems((prev) => ({ ...prev, [promoId]: data }));
  }, []);

  useEffect(() => {
    Promise.all([
      getAllPromotionsAdmin().then(setPromotions),
      getAllProductsAdmin().then(setAllProducts),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function createPromo() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const id = await createPromotionAdmin({ title: newTitle, slug: slugify(newTitle), description: newDesc, ends_at: newEndsAt || null });
      setPromotions((prev) => [...prev, { id, title: newTitle, slug: slugify(newTitle), description: newDesc, is_active: true, ends_at: newEndsAt || null, created_at: new Date().toISOString() }]);
      setNewTitle(""); setNewDesc(""); setNewEndsAt("");
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: Promotion) {
    setSaving(true);
    try {
      await updatePromotionAdmin(p.id, { is_active: !p.is_active });
      setPromotions((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function deletePromo(p: Promotion) {
    if (!confirm(`Ștergi promoția "${p.title}"?`)) return;
    setSaving(true);
    try {
      await deletePromotionAdmin(p.id);
      setPromotions((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function handleExpand(promoId: string) {
    if (expanded === promoId) { setExpanded(null); return; }
    setExpanded(promoId);
    if (!items[promoId]) await loadItems(promoId);
  }

  async function handleAddProduct(promoId: string) {
    if (!addProductId) return;
    setSaving(true);
    try {
      await addPromotionItem(promoId, addProductId, addDiscountPct ? Number(addDiscountPct) : null, addDiscountPrice ? Number(addDiscountPrice) : null);
      await loadItems(promoId);
      setAddProductId(""); setAddDiscountPct(""); setAddDiscountPrice("");
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function handleRemoveItem(promoId: string, itemId: string) {
    setSaving(true);
    try {
      await removePromotionItem(itemId);
      setItems((prev) => ({ ...prev, [promoId]: prev[promoId]?.filter((i) => i.id !== itemId) ?? [] }));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900">Promoții</h1>
        <p className="text-sm text-zinc-500">Creează și gestionează campanii promoționale.</p>
      </div>

      {/* Create new promo */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Promoție nouă</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Titlu</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="ex: Summer Sale 2026" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Expiră la (opțional)</label>
            <input type="date" value={newEndsAt} onChange={(e) => setNewEndsAt(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Descriere</label>
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="Descriere scurtă a promoției" />
        </div>
        <button onClick={createPromo} disabled={saving || !newTitle.trim()} className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 disabled:opacity-50">
          {saving ? "Se creează…" : "Creează promoție"}
        </button>
      </div>

      {/* Promotions list */}
      <div className="space-y-3">
        {promotions.map((p) => (
          <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-900">{p.title}</h3>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {p.is_active ? "Activ" : "Inactiv"}
                  </span>
                </div>
                {p.description && <p className="text-xs text-zinc-400 mt-0.5">{p.description}</p>}
                {p.ends_at && <p className="text-[10px] text-zinc-400">Expiră: {new Date(p.ends_at).toLocaleDateString("ro-RO")}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(p)} disabled={saving} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-400 text-zinc-600">
                  {p.is_active ? "Dezactivează" : "Activează"}
                </button>
                <button onClick={() => handleExpand(p.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700">
                  {expanded === p.id ? "Închide" : "Produse"}
                </button>
                <button onClick={() => deletePromo(p)} disabled={saving} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1.5">Șterge</button>
              </div>
            </div>

            {/* Expanded items */}
            {expanded === p.id && (
              <div className="border-t border-zinc-100 p-4 bg-zinc-50">
                {/* Existing items */}
                {(items[p.id] ?? []).length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {(items[p.id] ?? []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-zinc-100">
                        <span className="text-sm text-zinc-800">{item.product?.name ?? item.product_id}</span>
                        <div className="flex items-center gap-3">
                          {item.discount_pct && <span className="text-xs font-bold text-red-600">-{item.discount_pct}%</span>}
                          {item.discount_price && <span className="text-xs font-bold text-red-600">{item.discount_price} RON</span>}
                          <button onClick={() => handleRemoveItem(p.id, item.id)} className="text-[10px] text-red-400 hover:text-red-600 font-bold">Elimină</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 mb-4">Niciun produs adăugat.</p>
                )}

                {/* Add product form */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Produs</label>
                    <select value={addProductId} onChange={(e) => setAddProductId(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400 bg-white">
                      <option value="">Selectează produs…</option>
                      {allProducts.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Disc. %</label>
                    <input type="number" value={addDiscountPct} onChange={(e) => setAddDiscountPct(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="20" min="0" max="100" />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Preț fix RON</label>
                    <input type="number" value={addDiscountPrice} onChange={(e) => setAddDiscountPrice(e.target.value)} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="99.99" />
                  </div>
                  <button onClick={() => handleAddProduct(p.id)} disabled={saving || !addProductId} className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 disabled:opacity-50 shrink-0">
                    Adaugă
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {promotions.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-8">Nicio promoție creată. Adaugă prima promoție mai sus.</p>
        )}
      </div>
    </div>
  );
}

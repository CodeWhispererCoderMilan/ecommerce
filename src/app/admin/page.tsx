"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAllProductsAdmin, deleteProductAdmin } from "@/lib/admin";
import type { AdminProductRow } from "@/types/database";

const BADGE_STYLE: Record<string, string> = {
  NOU:     "bg-blue-100 text-blue-700",
  LIMITAT: "bg-red-100 text-red-700",
  PROMO:   "bg-green-100 text-green-700",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProductsAdmin();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(p: AdminProductRow) {
    if (!confirm(`Ștergi „${p.name}"? Această acțiune este ireversibilă!`)) return;
    setDeletingId(p.id);
    try {
      await deleteProductAdmin(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      alert("Eroare la ștergere: " + String(err));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Produse</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{products.length} produse în baza de date</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Produs nou
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume, brand sau categorie…"
          className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-400 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">Niciun produs găsit.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Produs</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden md:table-cell">Brand</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden md:table-cell">Categorie</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Preț</th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{p.name}</p>
                      {p.badge && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${BADGE_STYLE[p.badge] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-600">{p.brand?.name ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-zinc-600">{p.category?.name ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-zinc-900">
                      {p.base_price > 0
                        ? new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(p.base_price) + " RON"
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.is_active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/produse/${p.slug}`}
                        target="_blank"
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                        title="Vizualizează"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </Link>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
                        title="Editează"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Șterge"
                      >
                        {deletingId === p.id ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

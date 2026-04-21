"use client";

import { deleteVariant } from "@/lib/admin";
import type { VariantInput } from "@/lib/admin";

interface Props {
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}

const EMPTY: VariantInput = {
  name: "",
  sku: "",
  price: null,
  stock_quantity: 0,
  is_active: true,
  sort_order: 0,
};

export default function VariantsEditor({ variants, onChange }: Props) {
  function add() {
    onChange([...variants, { ...EMPTY, sort_order: variants.length }]);
  }

  function update(i: number, patch: Partial<VariantInput>) {
    onChange(variants.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  }

  async function remove(i: number) {
    const v = variants[i];
    if (v.id) {
      if (!confirm(`Ștergi varianta "${v.name}"? Această acțiune este ireversibilă.`)) return;
      try {
        await deleteVariant(v.id);
      } catch (err) {
        alert("Eroare la ștergere: " + String(err));
        return;
      }
    }
    onChange(variants.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {variants.length === 0 && (
        <p className="text-sm text-zinc-400 italic">
          Nicio variantă. Adaugă variante dacă produsul există în mai multe culori sau configurații.
        </p>
      )}

      {variants.map((v, i) => (
        <div key={i} className="border border-zinc-200 rounded-xl p-4 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Nume variantă *</label>
              <input
                type="text"
                value={v.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="ex: Negru, Alb, Wireless…"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">SKU / Cod</label>
              <input
                type="text"
                value={v.sku ?? ""}
                onChange={(e) => update(i, { sku: e.target.value })}
                placeholder="SKU-001"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Preț (RON)</label>
              <input
                type="number"
                value={v.price ?? ""}
                onChange={(e) => update(i, { price: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stoc</label>
              <input
                type="number"
                value={v.stock_quantity}
                onChange={(e) => update(i, { stock_quantity: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
            <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={v.is_active}
                onChange={(e) => update(i, { is_active: e.target.checked })}
                className="rounded"
              />
              Variantă activă
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Șterge varianta
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-xl text-sm font-semibold text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
      >
        + Adaugă variantă (culoare / model)
      </button>
    </div>
  );
}

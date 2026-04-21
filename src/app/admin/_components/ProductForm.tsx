"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ProductDetail, Brand, Category, RichBlock } from "@/types/database";
import {
  createProductAdmin,
  updateProductAdmin,
  upsertVariants,
  uploadAndSaveImage,
  type VariantInput,
} from "@/lib/admin";
import RichEditor from "./RichEditor";
import ImageManager, { type PendingImage } from "./ImageManager";
import VariantsEditor from "./VariantsEditor";
import SpecsForm from "./SpecsForm";

interface Props {
  product?: ProductDetail;
  brands: Brand[];
  categories: Category[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, "a").replace(/[îí]/g, "i").replace(/ș/g, "s").replace(/ț/g, "t").replace(/é/g, "e")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductForm({ product, brands, categories }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  // Basic info
  const [name, setName]               = useState(product?.name ?? "");
  const [slug, setSlug]               = useState(product?.slug ?? "");
  const [slugManual, setSlugManual]   = useState(isEdit);
  const [sku, setSku]                 = useState(product?.sku ?? "");
  const [categoryId, setCategoryId]   = useState(product?.category?.id ?? "");
  const [brandId, setBrandId]         = useState(product?.brand?.id ?? "");
  const [badge, setBadge]             = useState<string>(product?.badge ?? "");
  const [price, setPrice]             = useState<number>(product?.base_price ?? 0);
  const [isActive, setIsActive]       = useState(product?.is_active ?? true);

  // Descriptions
  const [description, setDescription] = useState(product?.description ?? "");
  const [highlights, setHighlights]   = useState<string[]>(product?.highlights ?? []);
  const [richDesc, setRichDesc]       = useState<RichBlock[]>(product?.rich_description ?? []);

  // Specs
  const [specs, setSpecs]             = useState<Record<string, unknown>>(
    (product?.specs as Record<string, unknown>) ?? {}
  );

  // Images
  const [existingImages, setExistingImages] = useState(product?.images ?? []);
  const [pendingImages, setPendingImages]   = useState<PendingImage[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantInput[]>(
    (product?.variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? "",
      price: v.price,
      stock_quantity: v.stock_quantity,
      is_active: v.is_active,
      sort_order: v.sort_order,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setName(val);
    if (!slugManual) setSlug(slugify(val));
  }

  // Highlights helpers
  function addHighlight() { setHighlights([...highlights, ""]); }
  function updateHighlight(i: number, v: string) {
    setHighlights(highlights.map((h, idx) => idx === i ? v : h));
  }
  function removeHighlight(i: number) {
    setHighlights(highlights.filter((_, idx) => idx !== i));
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Numele produsului este obligatoriu."); return; }
    if (!slug.trim()) { setError("Slug-ul este obligatoriu."); return; }

    setSaving(true);
    setError(null);

    try {
      const data = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim() || null,
        category_id: categoryId || null,
        brand_id: brandId || null,
        description: description.trim(),
        highlights: highlights.filter((h) => h.trim()),
        rich_description: richDesc,
        specs,
        base_price: price,
        badge: badge || null,
        is_active: isActive,
      };

      let productId: string;
      if (isEdit) {
        productId = product!.id;
        await updateProductAdmin(productId, data);
      } else {
        productId = await createProductAdmin(data);
      }

      // Upload pending images
      for (let i = 0; i < pendingImages.length; i++) {
        const img = pendingImages[i];
        await uploadAndSaveImage({
          file: img.file,
          productId,
          productSlug: slug.trim(),
          isPrimary: img.isPrimary && existingImages.every((e) => !e.is_primary),
          displayOrder: existingImages.length + i,
        });
      }

      // Upsert variants
      if (variants.length > 0) {
        await upsertVariants(productId, variants);
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }, [name, slug, sku, categoryId, brandId, badge, price, isActive, description, highlights, richDesc, specs, pendingImages, existingImages, variants, isEdit, product, router]);

  const sectionClass = "bg-white rounded-2xl border border-zinc-200 p-6 space-y-4";
  const sectionTitle = "text-sm font-black uppercase tracking-widest text-zinc-800 mb-1";
  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1";
  const inputClass = "w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Basic Info ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Informații generale</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Nume produs *</label>
            <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ex: Keychron K3 Pro QMK…" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Slug URL *</label>
            <input type="text" value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              placeholder="keychron-k3-pro" required className={inputClass} />
            <p className="text-[10px] text-zinc-400 mt-1">Va fi URL-ul produsului: /produse/{slug || "…"}</p>
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
              placeholder="ex: KC-K3PRO-WHT" className={inputClass} />
            <p className="text-[10px] text-zinc-400 mt-1">Cod unic de identificare produs.</p>
          </div>
          <div>
            <label className={labelClass}>Preț de bază (RON) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              min="0" step="0.01" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Categorie</label>
            <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSpecs({}); }}
              className={inputClass + " bg-white cursor-pointer"}>
              <option value="">— Selectează categoria —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Brand</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)}
              className={inputClass + " bg-white cursor-pointer"}>
              <option value="">— Selectează brand-ul —</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Badge</label>
            <select value={badge} onChange={(e) => setBadge(e.target.value)}
              className={inputClass + " bg-white cursor-pointer"}>
              <option value="">Fără badge</option>
              <option value="NOU">NOU</option>
              <option value="LIMITAT">LIMITAT</option>
              <option value="PROMO">PROMO</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-sm font-semibold text-zinc-700">Produs activ (vizibil în magazin)</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Images ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Imagini produs</h3>
        <ImageManager
          existingImages={existingImages}
          pendingImages={pendingImages}
          onExistingChange={setExistingImages}
          onPendingChange={setPendingImages}
        />
      </div>

      {/* ── Short Description ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Descriere scurtă</h3>
        <p className="text-xs text-zinc-400">Apare sub butonul "Adaugă în coș". 1-3 propoziții.</p>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3} placeholder="Descriere scurtă, puncte cheie ale produsului…"
          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 outline-none focus:border-zinc-500 resize-none" />
      </div>

      {/* ── Highlights ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Highlights</h3>
        <p className="text-xs text-zinc-400">Puncte cheie afișate ca listă verde sub descriere.</p>
        <div className="space-y-2">
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input type="text" value={h} onChange={(e) => updateHighlight(i, e.target.value)}
                placeholder={`Highlight ${i + 1}…`}
                className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500" />
              <button type="button" onClick={() => removeHighlight(i)}
                className="w-9 flex items-center justify-center text-red-400 hover:text-red-600 border border-zinc-200 rounded-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
          <button type="button" onClick={addHighlight}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Adaugă highlight
          </button>
        </div>
      </div>

      {/* ── Rich Description ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Descriere completă (tab Descriere)</h3>
        <p className="text-xs text-zinc-400">Mix de paragrafe text, titluri de secțiuni și imagini — similar cu eMAG sau Amazon.</p>
        <RichEditor
          blocks={richDesc}
          onChange={setRichDesc}
          productSlug={slug || "new-product"}
        />
      </div>

      {/* ── Specs (keyboard + mouse only for characteristics tab) ── */}
      {categoryId && (
        <div className={sectionClass}>
          <h3 className={sectionTitle}>
            Specificații tehnice
            {selectedCategory && <span className="ml-2 font-normal normal-case text-zinc-400">({selectedCategory.name})</span>}
          </h3>
          <p className="text-xs text-zinc-400">
            {(selectedCategory?.slug === "tastaturi" || selectedCategory?.slug === "mouse-uri")
              ? "Afisate in tab-ul Caracteristici al paginii de produs."
              : "Afisate in tab-ul de descriere ca specificatii generale."}
          </p>
          <SpecsForm
            categorySlug={selectedCategory?.slug ?? ""}
            specs={specs}
            onChange={setSpecs}
          />
        </div>
      )}

      {/* ── Variants ── */}
      <div className={sectionClass}>
        <h3 className={sectionTitle}>Variante (culori / modele)</h3>
        <p className="text-xs text-zinc-400">Fiecare variantă are propriul SKU, preț și stoc. Varianta fără preț moștenește prețul de bază.</p>
        <VariantsEditor variants={variants} onChange={setVariants} />
      </div>

      {/* ── Save button ── */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors">
          Anulează
        </button>
        <button type="submit" disabled={saving}
          className="px-8 py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Se salvează…" : isEdit ? "Salvează modificările" : "Creează produsul"}
        </button>
      </div>
    </form>
  );
}

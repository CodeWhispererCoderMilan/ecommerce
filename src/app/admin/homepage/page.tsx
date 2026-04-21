"use client";

import { useEffect, useState } from "react";
import {
  getHomepageHeroes, upsertHomepageHero, deleteHomepageHero,
  getHomepagePromoCards, updateHomepagePromoCard,
  uploadHomepagePhoto, getAdminBrands,
} from "@/lib/admin";
import type { HomepageHero, HomepagePromoCard, Brand } from "@/types/database";

export default function AdminHomepagePage() {
  const [heroes, setHeroes] = useState<HomepageHero[]>([]);
  const [promoCards, setPromoCards] = useState<HomepagePromoCard[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heroForm, setHeroForm] = useState({ brand_id: "", headline: "", subtext: "", is_active: true });
  const [card1Form, setCard1Form] = useState({ button_text: "", link_url: "" });
  const [card2Form, setCard2Form] = useState({ button_text: "", link_url: "" });

  useEffect(() => {
    Promise.all([
      getHomepageHeroes().then(setHeroes),
      getHomepagePromoCards().then((cards) => {
        setPromoCards(cards);
        const c1 = cards.find((c) => c.slot === 1);
        const c2 = cards.find((c) => c.slot === 2);
        if (c1) setCard1Form({ button_text: c1.button_text, link_url: c1.link_url });
        if (c2) setCard2Form({ button_text: c2.button_text, link_url: c2.link_url });
      }),
      getAdminBrands().then(setBrands),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleHeroPhoto(file: File, heroId?: string) {
    setSaving(true);
    try {
      const url = await uploadHomepagePhoto("hero", file);
      if (heroId) {
        await upsertHomepageHero({ id: heroId, photo_url: url });
        setHeroes((prev) => prev.map((h) => h.id === heroId ? { ...h, photo_url: url } : h));
      } else {
        setHeroForm((f) => ({ ...f, _photo_url: url } as typeof f & { _photo_url: string }));
      }
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function addHero() {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = await upsertHomepageHero({ ...(heroForm as any) });
      const newHero: HomepageHero = { id, ...heroForm, photo_url: null, sort_order: heroes.length, created_at: new Date().toISOString(), brand: brands.find((b) => b.id === heroForm.brand_id) ?? null };
      setHeroes((prev) => [...prev, newHero]);
      setHeroForm({ brand_id: "", headline: "", subtext: "", is_active: true });
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function toggleHeroActive(h: HomepageHero) {
    setSaving(true);
    try {
      await upsertHomepageHero({ id: h.id, is_active: !h.is_active });
      setHeroes((prev) => prev.map((x) => x.id === h.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function removeHero(id: string) {
    if (!confirm("Ștergi acest card hero?")) return;
    setSaving(true);
    try {
      await deleteHomepageHero(id);
      setHeroes((prev) => prev.filter((h) => h.id !== id));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function savePromoCard(slot: 1 | 2, form: { button_text: string; link_url: string }) {
    setSaving(true);
    try {
      await updateHomepagePromoCard(slot, form);
      setPromoCards((prev) => prev.map((c) => c.slot === slot ? { ...c, ...form } : c));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  async function handlePromoCardPhoto(slot: 1 | 2, file: File) {
    setSaving(true);
    try {
      const url = await uploadHomepagePhoto(`promo-${slot}`, file);
      await updateHomepagePromoCard(slot, { photo_url: url });
      setPromoCards((prev) => prev.map((c) => c.slot === slot ? { ...c, photo_url: url } : c));
    } catch (e) { alert(String(e)); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /></div>;

  const card1 = promoCards.find((c) => c.slot === 1);
  const card2 = promoCards.find((c) => c.slot === 2);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Homepage</h1>
        <p className="text-sm text-zinc-500">Configurează cardul hero mare și cele 2 carduri promoționale.</p>
      </div>

      {/* ── Hero cards ── */}
      <section>
        <h2 className="text-base font-black text-zinc-900 mb-4 uppercase tracking-widest">Carduri Hero (mare)</h2>

        {/* Existing heroes */}
        <div className="space-y-3 mb-6">
          {heroes.map((h) => (
            <div key={h.id} className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-20 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                {h.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={h.photo_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-400">Fără foto</div>
                }
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-zinc-900">{h.headline || "—"}</p>
                <p className="text-xs text-zinc-400">{h.subtext}</p>
                {h.brand && <p className="text-[10px] text-blue-600 mt-0.5">{(h.brand as Brand).name}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase">
                  Foto
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroPhoto(f, h.id); }} />
                </label>
                <button
                  onClick={() => toggleHeroActive(h)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg ${h.is_active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}
                >
                  {h.is_active ? "Activ" : "Inactiv"}
                </button>
                <button onClick={() => removeHero(h.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold">Șterge</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new hero */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Adaugă card hero</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Brand</label>
              <select value={heroForm.brand_id} onChange={(e) => setHeroForm((f) => ({ ...f, brand_id: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400">
                <option value="">Fără brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Titlu / Headline</label>
              <input value={heroForm.headline} onChange={(e) => setHeroForm((f) => ({ ...f, headline: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="ex: Echipează-te ca un PRO" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Subtext</label>
            <input value={heroForm.subtext} onChange={(e) => setHeroForm((f) => ({ ...f, subtext: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="Descriere scurtă…" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
              <input type="checkbox" checked={heroForm.is_active} onChange={(e) => setHeroForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
              Activ
            </label>
            <button onClick={addHero} disabled={saving} className="ml-auto px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 disabled:opacity-50">
              {saving ? "Se salvează…" : "Adaugă"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Promo cards ── */}
      <section>
        <h2 className="text-base font-black text-zinc-900 mb-4 uppercase tracking-widest">Carduri Promoționale (mici)</h2>
        <div className="grid grid-cols-2 gap-4">
          {([
            { slot: 1 as const, card: card1, form: card1Form, setForm: setCard1Form },
            { slot: 2 as const, card: card2, form: card2Form, setForm: setCard2Form },
          ]).map(({ slot, card, form, setForm }) => (
            <div key={slot} className="bg-white border border-zinc-200 rounded-2xl p-5">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Card {slot}</p>
              {/* Photo */}
              <div className="w-full h-28 rounded-xl overflow-hidden bg-zinc-100 mb-3 relative">
                {card?.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={card.photo_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">Fără foto</div>
                }
              </div>
              <label className="block mb-3 cursor-pointer">
                <span className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase">Schimbă fotografia</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePromoCardPhoto(slot, f); }} />
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Text buton</label>
                  <input value={form.button_text} onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="ex: Asta vreau" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Link URL</label>
                  <input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-zinc-400" placeholder="/produse" />
                </div>
              </div>
              <button onClick={() => savePromoCard(slot, form)} disabled={saving} className="mt-3 w-full px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 disabled:opacity-50">
                {saving ? "Se salvează…" : "Salvează"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

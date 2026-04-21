"use client";

import { useState } from "react";
import type { ProductDetail, RichBlock } from "@/types/database";

interface Props {
  product: ProductDetail;
}

/* ── Rich description renderer ─────────────────────────────── */

function RichContent({ blocks }: { blocks: RichBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="text-xl font-bold text-zinc-900 leading-snug pt-4">
              {block.content}
            </h2>
          );
        }
        if (block.type === "text") {
          return (
            <p key={i} className="text-sm text-zinc-600 leading-relaxed">
              {block.content}
            </p>
          );
        }
        if (block.type === "image") {
          return (
            <figure key={i} className="my-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.url}
                alt={block.alt ?? ""}
                className="w-full rounded-2xl object-cover max-h-[480px]"
              />
              {block.caption && (
                <figcaption className="text-xs text-zinc-400 mt-2 text-center">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ── Features grid ──────────────────────────────────────────── */

type SpecItem = { label: string; value: string };
type SpecGroup = { title: string; items: SpecItem[] };

function formatBool(v: unknown): string {
  if (v === true)  return "Da";
  if (v === false) return "Nu";
  return "—";
}

function buildKeyboardGroups(s: Record<string, unknown>): SpecGroup[] {
  const groups: SpecGroup[] = [];

  const ergItems: SpecItem[] = [
    s.layout         ? { label: "Layout",             value: String(s.layout) }         : null,
    s.switch_type    ? { label: "Tip tastatură",       value: String(s.switch_type) }    : null,
    s.material       ? { label: "Material",            value: String(s.material) }        : null,
    s.color          ? { label: "Culoare",             value: String(s.color) }           : null,
    s.rgb !== undefined ? { label: "Iluminare",        value: formatBool(s.rgb) }         : null,
    s.wrist_rest !== undefined ? { label: "Suport pumn", value: formatBool(s.wrist_rest) } : null,
    s.low_profile !== undefined ? { label: "Low profile", value: formatBool(s.low_profile) } : null,
  ].filter(Boolean) as SpecItem[];
  if (ergItems.length) groups.push({ title: "Ergonomie", items: ergItems });

  const perfItems: SpecItem[] = [
    s.rollover       ? { label: "Rollover",            value: String(s.rollover) }         : null,
    s.polling_rate_hz ? { label: "Polling rate",       value: `${s.polling_rate_hz} Hz` } : null,
    s.polling_rate_8k !== undefined ? { label: "8K Polling", value: formatBool(s.polling_rate_8k) } : null,
    s.memory !== undefined ? { label: "Memorie",       value: formatBool(s.memory) }       : null,
  ].filter(Boolean) as SpecItem[];
  if (perfItems.length) groups.push({ title: "Performanță", items: perfItems });

  const keyItems: SpecItem[] = [
    s.key_count      ? { label: "Număr taste",         value: String(s.key_count) }       : null,
    s.keycap_material ? { label: "Material taste",     value: String(s.keycap_material) } : null,
    s.macro_keys !== undefined ? { label: "Taste macro", value: formatBool(s.macro_keys) } : null,
    s.switch_type    ? { label: "Switch",              value: String(s.switch_type) }      : null,
    s.switch_variant ? { label: "Tip switch",          value: String(s.switch_variant) }   : null,
    s.switch_brand   ? { label: "Brand switch",        value: String(s.switch_brand) }     : null,
    s.hot_swap !== undefined ? { label: "Hot-Swap",    value: formatBool(s.hot_swap) }     : null,
    s.multimedia_keys !== undefined ? { label: "Taste multimedia", value: formatBool(s.multimedia_keys) } : null,
  ].filter(Boolean) as SpecItem[];
  if (keyItems.length) groups.push({ title: "Taste", items: keyItems });

  const connItems: SpecItem[] = [
    Array.isArray(s.connectivity) && s.connectivity.length
      ? { label: "Mod conectare", value: (s.connectivity as string[]).join(", ") } : null,
    s.battery_life   ? { label: "Autonomie",           value: String(s.battery_life) }    : null,
    s.connector      ? { label: "Conector",            value: String(s.connector) }        : null,
    s.cable_type     ? { label: "Tip cablu",           value: String(s.cable_type) }       : null,
    s.cable_length   ? { label: "Lungime cablu",       value: String(s.cable_length) }     : null,
    s.detachable_cable !== undefined ? { label: "Cablu detașabil", value: formatBool(s.detachable_cable) } : null,
  ].filter(Boolean) as SpecItem[];
  if (connItems.length) groups.push({ title: "Conectivitate", items: connItems });

  const otherItems: SpecItem[] = [
    s.software ? { label: "Software", value: String(s.software) } : null,
  ].filter(Boolean) as SpecItem[];
  if (otherItems.length) groups.push({ title: "Altele", items: otherItems });

  return groups;
}

function buildMouseGroups(s: Record<string, unknown>): SpecGroup[] {
  const groups: SpecGroup[] = [];

  const perfItems: SpecItem[] = [
    s.sensor_type    ? { label: "Tip senzor",          value: String(s.sensor_type) }     : null,
    s.sensor         ? { label: "Senzor optic",        value: String(s.sensor) }          : null,
    s.max_dpi        ? { label: "DPI",                 value: `${s.max_dpi} DPI` }        : null,
    s.adjustable_dpi !== undefined ? { label: "DPI ajustabil", value: formatBool(s.adjustable_dpi) } : null,
    s.tracking_speed_ips ? { label: "Viteză urmărire", value: `${s.tracking_speed_ips} IPS` } : null,
    s.acceleration_g ? { label: "Accelerație",        value: `${s.acceleration_g}G` }     : null,
    s.lod            ? { label: "LOD",                 value: String(s.lod) }             : null,
    s.polling_rate_hz ? { label: "Polling rate",       value: `${s.polling_rate_hz} Hz` } : null,
    s.polling_rate_8k !== undefined ? { label: "8K Polling", value: formatBool(s.polling_rate_8k) } : null,
    s.switch_buttons ? { label: "Switch-uri butoane",  value: String(s.switch_buttons) }  : null,
    s.memory !== undefined ? { label: "Memorie",       value: formatBool(s.memory) }       : null,
  ].filter(Boolean) as SpecItem[];
  if (perfItems.length) groups.push({ title: "Performanță", items: perfItems });

  const ergItems: SpecItem[] = [
    s.shape          ? { label: "Formă",               value: String(s.shape) }           : null,
    s.rgb !== undefined ? { label: "Iluminare",        value: formatBool(s.rgb) }         : null,
    s.buttons        ? { label: "Număr butoane",       value: String(s.buttons) }         : null,
    s.weight_grams   ? { label: "Greutate",            value: `${s.weight_grams} g` }     : null,
    s.grip           ? { label: "Grip",                value: String(s.grip) }            : null,
  ].filter(Boolean) as SpecItem[];
  if (ergItems.length) groups.push({ title: "Ergonomie", items: ergItems });

  const connItems: SpecItem[] = [
    Array.isArray(s.connectivity) && s.connectivity.length
      ? { label: "Mod conectare", value: (s.connectivity as string[]).join(", ") } : null,
    s.battery_life   ? { label: "Autonomie",           value: String(s.battery_life) }    : null,
    s.cable_type     ? { label: "Tip cablu",           value: String(s.cable_type) }       : null,
    s.cable_length   ? { label: "Lungime cablu",       value: String(s.cable_length) }     : null,
    s.connector      ? { label: "Conector",            value: String(s.connector) }        : null,
  ].filter(Boolean) as SpecItem[];
  if (connItems.length) groups.push({ title: "Conectivitate", items: connItems });

  return groups;
}

function FeaturesGrid({ specs, categorySlug }: { specs: Record<string, unknown>; categorySlug?: string | null }) {
  let groups: SpecGroup[] = [];

  if (categorySlug === "tastaturi" || specs.switch_type || specs.hot_swap !== undefined || specs.layout) {
    groups = buildKeyboardGroups(specs);
  } else if (categorySlug === "mouse-uri" || specs.max_dpi || specs.sensor) {
    groups = buildMouseGroups(specs);
  }

  if (groups.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-zinc-900 mb-4">Caracteristici</h2>
      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
        {groups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? "border-t border-zinc-100" : ""}>
            {/* Group title */}
            <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-blue-600">{group.title}</h3>
            </div>
            {/* Items in 4-col grid */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                {group.items.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-bold text-zinc-900">{item.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reviews ───────────────────────────────────────────────── */

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)} className="transition-transform hover:scale-110">
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={(hovered || value) >= n ? "#f59e0b" : "none"}
            stroke={(hovered || value) >= n ? "#f59e0b" : "#d1d5db"} strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewsPanel() {
  const [rating, setRating] = useState(0);
  const [text, setText]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !text.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 pt-6">
      <div>
        <h3 className="text-lg font-bold text-zinc-900 mb-4">Recenzii</h3>
        <p className="text-sm text-zinc-400 italic">Nu există recenzii încă. Fii primul!</p>
      </div>
      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
        <h3 className="text-base font-bold text-zinc-900 mb-1">Lasă o recenzie și ajută comunitatea</h3>
        <p className="text-xs text-zinc-500 mb-5">Experiența ta contează pentru alți cumpărători.</p>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-4xl">🎉</span>
            <p className="font-bold text-zinc-900">Mulțumim pentru recenzie!</p>
            <p className="text-sm text-zinc-500">Va fi publicată după verificare.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nota ta</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                Recenzia ta <span className="text-red-400">*</span>
              </label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
                placeholder="Spune-ne cum ți s-a părut produsul…"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none transition-colors" />
            </div>
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-center">
              <p className="text-xs text-zinc-400 mb-2">Încarcă până la 5 imagini sau videoclipuri</p>
              <input type="file" accept="image/*,video/*" multiple className="text-xs text-zinc-500" />
            </div>
            <button type="submit" disabled={!rating || !text.trim()}
              className="w-full h-11 rounded-xl bg-zinc-900 text-white text-sm font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Publică recenzia
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Description panel ─────────────────────────────────────── */

function DescriptionPanel({ product }: { product: ProductDetail }) {
  const specs = product.specs as Record<string, unknown>;
  const hasRich = product.rich_description && product.rich_description.length > 0;

  return (
    <div className="pt-6">
      {/* Rich block content OR fallback plain text description */}
      {hasRich ? (
        <RichContent blocks={product.rich_description} />
      ) : product.description ? (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4 leading-snug">{product.name}</h2>
          <div className="space-y-3">
            {product.description.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-zinc-600 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      ) : null}

      {/* Features grid — keyboards and mice only */}
      {(product.category?.slug === "tastaturi" || product.category?.slug === "mouse-uri") && (
        <FeaturesGrid specs={specs} categorySlug={product.category?.slug} />
      )}
    </div>
  );
}

/* ── Main tabs ─────────────────────────────────────────────── */

const TABS = [
  { id: "description", label: "Descriere" },
  { id: "reviews",     label: "Recenzii" },
  { id: "questions",   label: "Întrebări" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProductTabs({ product }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <div className="mt-16">
      <div className="border-b border-zinc-200 flex gap-0">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === "description" && <DescriptionPanel product={product} />}
        {activeTab === "reviews"     && <ReviewsPanel />}
        {activeTab === "questions"   && (
          <div className="pt-8 text-center text-sm text-zinc-400 py-16">
            Nicio întrebare încă. Ai o întrebare? Contactează-ne!
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

/* ── Sub-filter tab definitions per category ─────────────────── */

type TabDef = { label: string; tip?: string; hot_swap?: string; platforma?: string };

const TABS: Record<string, TabDef[]> = {
  tastaturi: [
    { label: "Toate" },
    { label: "Magnetice",  tip: "magnetica" },
    { label: "Mecanice",   tip: "mecanica" },
    { label: "Membrane",   tip: "membrana" },
    { label: "Hot-Swap",   hot_swap: "true" },
  ],
  "mouse-uri": [
    { label: "Toate" },
    { label: "Simple",     tip: "simplu" },
    { label: "Mouse 8K",   tip: "8k" },
  ],
  controllere: [
    { label: "Toate" },
    { label: "PC / Switch",  platforma: "pc-switch" },
    { label: "PlayStation",  platforma: "playstation" },
    { label: "Xbox",         platforma: "xbox" },
    { label: "Multi-platform", platforma: "multi" },
  ],
  "volan-gaming": [
    { label: "Toate" },
    { label: "PS5 / PS4",     platforma: "playstation" },
    { label: "Xbox",          platforma: "xbox" },
    { label: "Nintendo Switch", platforma: "switch" },
    { label: "PC",            platforma: "pc" },
  ],
  accesorii: [
    { label: "Toate" },
    { label: "Mousepad-uri",  tip: "mousepad" },
    { label: "Switch-uri",    tip: "switch" },
    { label: "Folii",         tip: "folie" },
    { label: "Huse",          tip: "husa" },
    { label: "Standuri",      tip: "stand" },
  ],
};

const SORT_OPTIONS = [
  { value: "popular",    label: "Cele mai populare" },
  { value: "newest",     label: "Cele mai noi" },
  { value: "price_asc",  label: "Preț: crescător" },
  { value: "price_desc", label: "Preț: descrescător" },
];

interface Props {
  total: number;
}

export default function FilterBar({ total }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const categorie = params.get("categorie") ?? "";
  const activeTip      = params.get("tip") ?? "";
  const activeHotSwap  = params.get("hot_swap") ?? "";
  const activePlatform = params.get("platforma") ?? "";
  const activeSort     = params.get("sort") ?? "popular";

  // First category slug (for tab lookup when multi-category e.g. "tastaturi,mouse-uri")
  const primaryCat = categorie.split(",")[0];
  const tabs = TABS[primaryCat] ?? [];

  const navigate = useCallback((overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    // Clear filter params first
    ["tip", "hot_swap", "platforma", "page"].forEach((k) => next.delete(k));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    router.push(`${pathname}?${next.toString()}`);
  }, [params, pathname, router]);

  // Determine which tab is active
  function isTabActive(tab: TabDef) {
    if (!tab.tip && !tab.hot_swap && !tab.platforma) {
      return !activeTip && !activeHotSwap && !activePlatform;
    }
    if (tab.tip)      return activeTip === tab.tip;
    if (tab.hot_swap) return activeHotSwap === tab.hot_swap;
    if (tab.platforma) return activePlatform === tab.platforma;
    return false;
  }

  return (
    <div className="bg-white border-b border-zinc-100 sticky top-[88px] z-30">
      <div className="max-w-screen-xl mx-auto px-4">

        {/* Sub-filter tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-3 border-b border-zinc-100">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => navigate({
                  tip:      tab.tip,
                  hot_swap: tab.hot_swap,
                  platforma: tab.platforma,
                })}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                  isTabActive(tab)
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Sort bar */}
        <div className="flex items-center justify-between py-3 gap-4">
          <p className="text-xs text-zinc-400 shrink-0">
            <span className="font-semibold text-zinc-700">{total}</span> produse
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 hidden sm:inline">Sortează:</span>
            <select
              value={activeSort}
              onChange={(e) => navigate({ sort: e.target.value })}
              className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-700 bg-white outline-none focus:border-zinc-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { getProducts, getLatestProducts, type SortOption } from "@/lib/products";
import { getBrandBySlug } from "@/lib/brands";
import NavbarWrapper from "@/components/NavbarWrapper";
import BrandMarquee  from "@/components/BrandMarquee";
import FilterBar     from "./FilterBar";
import ProductCard   from "./ProductCard";
import Pagination    from "./Pagination";

// ── Config ────────────────────────────────────────────────────

const PER_PAGE = 24;

// Category display config
const CAT_META: Record<string, { title: string; hero: string; gradient: string }> = {
  tastaturi:    { title: "Tastaturi Gaming",  hero: "TASTATURI GAMING",   gradient: "from-zinc-900 via-zinc-800 to-zinc-900" },
  "mouse-uri":  { title: "Mouse-uri Gaming",  hero: "MOUSE-URI GAMING",   gradient: "from-slate-900 via-zinc-900 to-slate-900" },
  controllere:  { title: "Controllere",       hero: "CONTROLLERE",        gradient: "from-blue-950 via-zinc-900 to-blue-950" },
  "volan-gaming": { title: "Volan Gaming",   hero: "VOLAN GAMING",       gradient: "from-red-950 via-zinc-900 to-red-950" },
  accesorii:    { title: "Accesorii Gaming",  hero: "ACCESORII",          gradient: "from-zinc-900 via-slate-900 to-zinc-900" },
};

// ── Metadata ──────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const sp  = await searchParams;
  const cat = sp.categorie?.split(",")[0] ?? "";
  const meta = CAT_META[cat];
  return {
    title: meta ? `${meta.title} | NexusX` : "Produse | NexusX",
  };
}

// ── Page ──────────────────────────────────────────────────────

export default async function ProdusePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;

  const categorie = sp.categorie ?? "";
  const brandSlug = sp.brand ?? "";
  const tip       = sp.tip ?? "";
  const hot_swap  = sp.hot_swap === "true";
  const platforma = sp.platforma ?? "";
  const sort      = (sp.sort ?? "popular") as SortOption;
  const page      = Math.max(1, parseInt(sp.page ?? "1", 10));

  const primaryCat = categorie.split(",")[0];
  const catMeta    = CAT_META[primaryCat] ?? { title: "Produse", hero: "PRODUSE", gradient: "from-zinc-900 to-zinc-800" };

  const brand = brandSlug ? await getBrandBySlug(brandSlug).catch(() => null) : null;

  // Build display title based on active filter
  const SUB_LABELS: Record<string, string> = {
    magnetica: "Magnetice", mecanica: "Mecanice", membrana: "Membrane",
    "8k": "8K Polling Rate", simplu: "Simple", mousepad: "Mousepad-uri",
    switch: "Switch-uri", folie: "Folii Protecție", husa: "Huse & Carcase",
    stand: "Standuri & Încărcătoare",
  };
  const activeSubLabel =
    tip        ? SUB_LABELS[tip] :
    hot_swap   ? "Hot-Swap" :
    platforma  ? platforma.charAt(0).toUpperCase() + platforma.slice(1) :
    null;

  // Fetch products
  const { products, total } = await getProducts({
    categorySlug: categorie || undefined,
    brandSlug:    brandSlug || undefined,
    tip:          tip || undefined,
    hot_swap:     hot_swap || undefined,
    platforma:    platforma || undefined,
    sort,
    limit:  PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  // "Best selling" section — latest in the same category, no sub-filter
  const bestSelling = await getLatestProducts(8).catch(() => []);

  return (
    <>
      <NavbarWrapper />

      {/* ── Hero / Brand description ── */}
      {brand ? (
        <section className="relative overflow-hidden min-h-[260px] md:min-h-[320px] flex items-end">
          {brand.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.photo_url} alt={brand.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative z-10 max-w-screen-xl w-full mx-auto px-4 pb-12 flex items-end gap-6">
            {/* Floating brand card */}
            <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xl shrink-0">
              {brand.logo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 object-contain" />
                : <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-zinc-700 text-lg">{brand.name[0]}</div>
              }
              <div>
                {brand.hero_text && <p className="text-[10px] text-zinc-400">{brand.hero_text}</p>}
                <p className="font-black text-zinc-900 text-lg leading-tight">{brand.name}</p>
              </div>
            </div>
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
                <Link href="/" className="hover:text-white">Acasă</Link>
                <span>/</span>
                <span className="text-white">{brand.name}</span>
              </nav>
              {brand.description && <p className="text-zinc-300 text-sm max-w-md">{brand.description}</p>}
              <p className="text-zinc-500 text-xs mt-2">{total} produse disponibile</p>
            </div>
          </div>
        </section>
      ) : (
        <section className={`bg-gradient-to-r ${catMeta.gradient} relative overflow-hidden`}>
          <div className="max-w-screen-xl mx-auto px-4 py-14 md:py-20 flex items-end justify-between gap-8">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                <Link href="/" className="hover:text-zinc-300 transition-colors">Acasă</Link>
                <span>/</span>
                {activeSubLabel ? (
                  <>
                    <Link href={`/produse?categorie=${categorie}`} className="hover:text-zinc-300 transition-colors">{catMeta.title}</Link>
                    <span>/</span>
                    <span className="text-white">{activeSubLabel}</span>
                  </>
                ) : (
                  <span className="text-white">{catMeta.title}</span>
                )}
              </nav>
              <h1 className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">
                {activeSubLabel
                  ? <>{activeSubLabel}<br /><span className="text-zinc-400 text-2xl md:text-3xl font-bold normal-case tracking-normal">{catMeta.title}</span></>
                  : catMeta.hero
                }
              </h1>
              <p className="text-zinc-400 text-sm mt-3">{total} produse disponibile</p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </section>
      )}

      {/* ── Filter bar (sticky) ── */}
      <Suspense fallback={null}>
        <FilterBar total={total} />
      </Suspense>

      {/* ── Product grid ── */}
      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            <Suspense fallback={null}>
              <Pagination
                total={total}
                perPage={PER_PAGE}
                currentPage={page}
              />
            </Suspense>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-lg font-bold text-zinc-700 mb-1">Niciun produs găsit</p>
            <p className="text-sm text-zinc-400 mb-6">Încearcă un alt filtru sau explorează toate produsele.</p>
            <Link
              href={categorie ? `/produse?categorie=${categorie}` : "/produse"}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Șterge filtrele
            </Link>
          </div>
        )}

        {/* ── Best selling section ── */}
        {bestSelling.length > 0 && !tip && !hot_swap && !platforma && (
          <section className="mt-16 pt-12 border-t border-zinc-100">
            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-zinc-900 mb-6">
              Cele mai vândute {catMeta.title.toLowerCase()}
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {bestSelling.map((p) => {
                const priceStr = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(p.display_price);
                return (
                  <Link
                    key={p.id}
                    href={`/produse/${p.slug}`}
                    className="shrink-0 w-44 group"
                  >
                    <div className="w-full aspect-square rounded-xl bg-zinc-100 overflow-hidden mb-2.5">
                      {p.primary_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.primary_image_url}
                          alt={p.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-700 leading-snug line-clamp-2 group-hover:text-black transition-colors">{p.name}</p>
                    <p className="text-sm font-bold text-zinc-900 mt-1">
                      {p.display_price > 0 ? `${priceStr} RON` : "—"}
                    </p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${p.in_stock ? "text-green-600" : "text-red-500"}`}>
                      {p.in_stock ? "● În stoc" : "● Stoc epuizat"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Trust badges ── */}
        <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-zinc-100">
          {[
            { icon: "💳", title: "Plată în rate", sub: "2 sau 4 rate fără dobândă" },
            { icon: "🚀", title: "Expediem azi",  sub: "Comandă până la 16:00" },
            { icon: "🔄", title: "Returnare 30 zile", sub: "Fără întrebări" },
            { icon: "💬", title: "Suport rapid",  sub: "Echipă dedicată gameri" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-zinc-800">{item.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <BrandMarquee />

      {/* ── Footer ── */}
      <footer className="text-white pt-14 pb-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "url('/patterns/wavy-contour-background-topographic-contour-background-contour-lines-background-topographic-map-background-abstract-wavy-background-vector.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-zinc-950/90" />
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800">
          <div>
            <p className="font-display font-black text-xl mb-1">NEXUS<span className="text-red-600">X</span></p>
            <p className="text-zinc-400 text-xs leading-relaxed mt-2">Magazinul tău dedicat gamingului competitiv.</p>
          </div>
          <div>
            <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">NEXUSX.</p>
            {["Despre noi", "Blog", "Parteneri"].map((l) => (
              <a key={l} href="#" className="block text-xs text-zinc-400 hover:text-white py-0.5 transition-colors">{l}</a>
            ))}
          </div>
          <div>
            <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">ASISTENȚĂ</p>
            {["FAQ", "Urmărire comandă", "Returnări", "Contact"].map((l) => (
              <a key={l} href="#" className="block text-xs text-zinc-400 hover:text-white py-0.5 transition-colors">{l}</a>
            ))}
          </div>
          <div>
            <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">RĂMÂI CONECTAT</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email-ul tău" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500" />
              <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">Go</button>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 pt-8 text-center">
          <p className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tighter select-none">
            MAGAZINUL TĂU DE ESPORT<span className="animate-blink text-red-500">_</span>
          </p>
          <p className="text-zinc-500 text-xs mt-4">© 2026 NexusX · Termeni · Confidențialitate</p>
        </div>
      </footer>
    </>
  );
}

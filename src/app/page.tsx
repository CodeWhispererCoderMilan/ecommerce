"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getNewProducts } from "@/lib/promotions";
import { getHomepageBrands } from "@/lib/brands";
import type { User } from "@supabase/supabase-js";
import type { ProductListing, BrandWithMeta, Category, HomepageHero, HomepagePromoCard } from "@/types/database";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

const PATTERN_BG = "url('/patterns/wavy-contour-background-topographic-contour-background-contour-lines-background-topographic-map-background-abstract-wavy-background-vector.jpg')";

const TRUST_ITEMS = [
  { icon: "💳", title: "Plată în rate", sub: "2 sau 4 rate fără dobândă" },
  { icon: "🚀", title: "Expediată azi", sub: "Comandă până la ora 16:00" },
  { icon: "🔄", title: "Returnare 30 zile", sub: "Fără întrebări" },
  { icon: "💬", title: "Suport rapid", sub: "Echipă dedicată gameri" },
];

/* ─── Page ──────────────────────────────────────────────────── */

export default function HomePage() {
  const [user, setUser]         = useState<User | null>(null);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const [newProducts, setNewProducts]     = useState<ProductListing[]>([]);
  const [brands, setBrands]               = useState<BrandWithMeta[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [heroes, setHeroes]               = useState<HomepageHero[]>([]);
  const [promoCards, setPromoCards]       = useState<HomepagePromoCard[]>([]);

  async function checkAdmin(userId: string | undefined) {
    if (!userId) { setIsAdmin(false); return; }
    const { data } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
    setIsAdmin(!!data);
  }

  useEffect(() => {
    setHasMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
      if (session) setModalOpen(false);
    });

    getNewProducts(8).then(setNewProducts).catch(() => {});
    getHomepageBrands().then(setBrands).catch(() => {});

    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories(data ?? []));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("homepage_hero").select("*, brand:brands(*)").eq("is_active", true).order("sort_order").then(({ data }: { data: HomepageHero[] | null }) => setHeroes(data ?? []));
    supabase.from("homepage_promo_cards").select("*").order("slot").then(({ data }) => setPromoCards((data ?? []) as HomepagePromoCard[]));

    return () => subscription.unsubscribe();
  }, []);

  if (!hasMounted) return <Navbar user={null} isAdmin={false} onOpenAuth={() => {}} />;

  const hero = heroes[0] ?? null;
  const promoCard1 = promoCards.find((c) => c.slot === 1) ?? null;
  const promoCard2 = promoCards.find((c) => c.slot === 2) ?? null;

  return (
    <>
      <Navbar user={user} isAdmin={isAdmin} onOpenAuth={() => setModalOpen(true)} />
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}

      <main>

        {/* ── Hero: 1 big card + 2 small promo cards ── */}
        <section className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">

          {/* Big hero brand card */}
          <div className="relative w-full rounded-2xl overflow-hidden min-h-[340px] md:min-h-[420px] flex items-end">
            {hero?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.photo_url} alt={hero.headline} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 p-8 md:p-12">
              {hero?.brand && (
                <p className="text-white/60 text-xs font-bold uppercase tracking-[0.25em] mb-2">{hero.brand.name}</p>
              )}
              <h1 className="font-display font-black text-4xl md:text-6xl text-white uppercase leading-none mb-2">
                {hero?.headline || "Echipează-te"}
              </h1>
              {hero?.subtext && (
                <p className="text-white/70 text-sm md:text-base max-w-md mb-6">{hero.subtext}</p>
              )}
              <Link
                href={hero?.brand ? `/produse?brand=${hero.brand.slug}` : "/produse"}
                className="inline-block bg-white text-zinc-900 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                Descoperă →
              </Link>
            </div>
          </div>

          {/* 2 small promo cards */}
          <div className="grid grid-cols-2 gap-4">
            {[promoCard1, promoCard2].map((card, i) => (
              <Link
                key={i}
                href={card?.link_url ?? "/produse"}
                className="relative rounded-2xl overflow-hidden min-h-[180px] md:min-h-[220px] flex items-end group"
              >
                {card?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className={`absolute inset-0 ${i === 0 ? "bg-gradient-to-br from-zinc-900 to-zinc-700" : "bg-gradient-to-br from-slate-900 to-slate-700"}`} />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 p-5">
                  <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
                    {card?.button_text ?? (i === 0 ? "Asta vreau" : "E genu' meu")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trust badges ── */}
        <section className="border-y border-zinc-100 bg-white mt-4">
          <div className="max-w-screen-xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-zinc-800">{item.title}</p>
                  <p className="text-xs text-zinc-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Noutăți ── */}
        <section className="max-w-screen-xl mx-auto px-4 py-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight">[NOUTĂȚI]</h2>
            <Link href="/noutati" className="text-xs font-bold text-zinc-400 hover:text-black transition-colors uppercase tracking-wider">
              Vezi tot →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {newProducts.length > 0
              ? newProducts.map((p) => <ProductCard key={p.id} product={p} />)
              : Array.from({ length: 6 }).map((_, i) => <PlaceholderCard key={i} />)
            }
          </div>
        </section>

        {/* ── Brand bar ── */}
        <section className="bg-zinc-950 py-10">
          <div className="max-w-screen-xl mx-auto px-4">
            {brands.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {brands.map((b) => (
                  <Link
                    key={b.id}
                    href={`/produse?brand=${b.slug}`}
                    className="relative rounded-xl overflow-hidden min-h-[100px] flex flex-col justify-between group p-4"
                  >
                    {b.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.photo_url} alt={b.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
                    )}
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                    <p className="relative font-display font-black text-white text-lg z-10">{b.name}</p>
                    <div className="relative z-10">
                      {b.max_discount && (
                        <p className="text-white/80 text-xs font-bold">PÂNĂ LA -{Math.round(b.max_discount)}%</p>
                      )}
                      <span className="mt-1 inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded group-hover:bg-red-700 transition-colors">
                        Ofertele →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {["Epomaker", "GuliKit", "Keychron", "Pulsar", "Logitech", "Razer"].map((name) => (
                  <div key={name} className="relative rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 min-h-[100px] flex flex-col justify-between">
                    <p className="font-display font-black text-white text-lg">{name}</p>
                    <span className="inline-block bg-zinc-700 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded w-fit">
                      În curând
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Ultimele apariții (NOU products) ── */}
        <section className="max-w-screen-xl mx-auto px-4 py-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight">[ULTIMELE APARIȚII]</h2>
            <Link href="/noutati" className="text-xs font-bold text-zinc-400 hover:text-black transition-colors uppercase tracking-wider">
              Vezi tot →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {newProducts.length > 0
              ? newProducts.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)
              : Array.from({ length: 6 }).map((_, i) => <PlaceholderCard key={i} />)
            }
          </div>
        </section>

        {/* ── Top Categories ── */}
        {categories.length > 0 && (
          <section className="max-w-screen-xl mx-auto px-4 py-10">
            <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight mb-4">[TOP CATEGORII]</h2>
            <CategoryGrid categories={categories} />
          </section>
        )}

        {/* ── Value props ── */}
        <section className="bg-zinc-950 py-12">
          <div className="max-w-screen-xl mx-auto px-4 space-y-6">
            {[
              { title: "ECHIPEAZĂ-TE CA UN PRO.", body: "Selecție exclusivă de peste 500 produse alese pentru performanță, calitate și stil, de la brandurile favorite ale profesioniștilor." },
              { title: "SUSȚINUT DE LEGENDE.", body: "Ales de jucătorii din echipele de top. Produsele noastre sunt recomandate de cei mai urmăriți streameri și jucători competitivi." },
              { title: "O EXPERIENȚĂ DE NEUITAT.", body: "Nu vindem doar produse — construim experiențe. De la selecție la livrare, fiecare pas este gândit pentru tine." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="shrink-0 w-6 h-6 bg-red-600 rounded flex items-center justify-center mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-base uppercase tracking-wide">{item.title}</h3>
                  <p className="text-zinc-400 text-sm mt-1 max-w-xl">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Marquee ── */}
        <div className="bg-zinc-950 py-3 overflow-hidden border-y border-zinc-800">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array(24).fill("#RUSHSUCCESS").map((t, i) => (
              <span key={i} className="font-display font-black text-zinc-600 uppercase tracking-[0.3em] text-sm mx-6">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="text-white pt-14 pb-6 relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: PATTERN_BG, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-zinc-950/90" />
          <div className="relative z-10 max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800">
            <div>
              <p className="font-display font-black text-xl mb-1">NEXUS<span className="text-red-600">X</span></p>
              <p className="text-zinc-400 text-xs leading-relaxed mt-2">Magazinul tău dedicat gamingului competitiv. Periferice, echipamente și accesorii pentru fiecare nivel.</p>
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">NEXUSX.</p>
              {["Despre noi", "Blog", "Parteneri", "Cariere"].map((l) => (
                <a key={l} href="#" className="block text-xs text-zinc-400 hover:text-white py-0.5 transition-colors">{l}</a>
              ))}
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">ASISTENȚĂ</p>
              {["FAQ", "Urmărire comandă", "Plată", "Livrare", "Returnări", "Contact"].map((l) => (
                <a key={l} href="#" className="block text-xs text-zinc-400 hover:text-white py-0.5 transition-colors">{l}</a>
              ))}
            </div>
            <div>
              <p className="font-display font-bold text-xs uppercase tracking-widest text-zinc-400 mb-3">RĂMÂI CONECTAT</p>
              <div className="flex gap-2 mt-1">
                <input type="email" placeholder="Email-ul tău" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500" />
                <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">Go</button>
              </div>
              <div className="flex gap-3 mt-4">
                {["TW", "IG", "YT", "TK"].map((s) => (
                  <a key={s} href="#" className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:text-white transition-colors">{s}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-screen-xl mx-auto px-4 pt-8 text-center">
            <p className="font-display font-black text-5xl md:text-7xl text-white uppercase tracking-tighter select-none">
              MAGAZINUL TĂU DE ESPORT<span className="animate-blink text-red-500">_</span>
            </p>
            <p className="text-zinc-500 text-xs mt-4">© 2026 NexusX · Termeni · Confidențialitate · Cookies</p>
          </div>
        </footer>
      </main>
    </>
  );
}

/* ─── Category grid (varied sizes) ─────────────────────────── */

function CategoryGrid({ categories }: { categories: Category[] }) {
  const CAT_GRADIENTS: Record<string, string> = {
    tastaturi:      "from-blue-950 via-blue-900 to-zinc-900",
    "mouse-uri":    "from-zinc-900 via-zinc-800 to-gray-900",
    controllere:    "from-red-950 via-red-900 to-zinc-900",
    accesorii:      "from-slate-900 via-slate-800 to-zinc-900",
    "volan-gaming": "from-emerald-950 via-emerald-900 to-zinc-900",
  };

  const CAT_LABELS: Record<string, string[]> = {
    tastaturi:      ["Magnetice", "Compacte", "Mecanice"],
    "mouse-uri":    ["Wireless", "Ușor", "8K"],
    controllere:    ["Hall Effect", "Multi-platform"],
    accesorii:      ["Mousepad", "Switch-uri"],
    "volan-gaming": ["Force Feedback", "PC & Console"],
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] gap-3">
      {categories.map((cat, i) => {
        const isLarge = cat.card_size === "large" || (cat.card_size === "normal" && i === 0);
        const isSmall = cat.card_size === "small";
        const gradient = CAT_GRADIENTS[cat.slug] ?? "from-zinc-900 to-zinc-800";
        const labels = CAT_LABELS[cat.slug] ?? [];

        return (
          <Link
            key={cat.id}
            href={`/produse?categorie=${cat.slug}`}
            className={`relative rounded-xl overflow-hidden flex flex-col justify-end group
              ${isLarge ? "md:col-span-2 md:row-span-2" : ""}
              ${isSmall ? "" : ""}
            `}
          >
            {cat.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.photo_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="relative z-10 p-4 md:p-5">
              <h3 className={`font-display font-black text-white uppercase ${isLarge ? "text-2xl md:text-3xl" : "text-lg"}`}>
                {cat.name}
              </h3>
              {labels.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {labels.map((s) => (
                    <span key={s} className="bg-white/10 group-hover:bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Product card ──────────────────────────────────────────── */

function ProductCard({ product: p }: { product: ProductListing }) {
  const badge = p.display_badge ?? p.badge;
  const badgeClass =
    badge === "NOU"     ? "bg-blue-600" :
    badge === "LIMITAT" ? "bg-red-600"  :
    badge === "PROMO"   ? "bg-green-600": "bg-zinc-700";

  const priceStr = p.display_price > 0
    ? new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(p.display_price) + " RON"
    : "—";

  return (
    <Link href={`/produse/${p.slug}`} className="shrink-0 w-44 group">
      <div className="relative w-full aspect-square rounded-xl bg-zinc-100 mb-2.5 overflow-hidden">
        {p.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
        )}
        {badge && (
          <span className={`absolute top-2 left-2 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${badgeClass}`}>
            {badge}
          </span>
        )}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      </div>
      <p className="text-xs text-zinc-700 leading-snug line-clamp-2 group-hover:text-black transition-colors">{p.name}</p>
      <p className="text-sm font-bold text-zinc-900 mt-1">{priceStr}</p>
      <p className={`text-[10px] font-semibold mt-0.5 ${p.in_stock ? "text-green-600" : "text-red-500"}`}>
        {p.in_stock ? "● În stoc" : "● Stoc epuizat"}
      </p>
    </Link>
  );
}

function PlaceholderCard() {
  return (
    <div className="shrink-0 w-44 animate-pulse">
      <div className="w-full aspect-square rounded-xl bg-zinc-100 mb-2.5" />
      <div className="h-3 bg-zinc-100 rounded mb-1.5 w-3/4" />
      <div className="h-3 bg-zinc-100 rounded w-1/2" />
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import NavbarWrapper from "@/components/NavbarWrapper";
import { getActivePromotions, getPromotionItems } from "@/lib/promotions";
import type { Promotion, PromotionItem } from "@/types/database";

export const metadata: Metadata = { title: "Promoții | NexusX" };

export default async function PromotiiPage() {
  const promotions = await getActivePromotions().catch(() => [] as Promotion[]);

  const promotionsWithItems = await Promise.all(
    promotions.map(async (promo) => ({
      promo,
      items: await getPromotionItems(promo.id).catch(() => [] as PromotionItem[]),
    }))
  );

  return (
    <>
      <NavbarWrapper />

      {/* Hero */}
      <section className="bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 py-16 px-4">
        <div className="max-w-screen-xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
            <Link href="/" className="hover:text-zinc-300">Acasă</Link>
            <span>/</span>
            <span className="text-white">Promoții</span>
          </nav>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white uppercase leading-none">
            PROMOȚII
          </h1>
          <p className="text-zinc-400 text-sm mt-3">{promotions.length} promoții active</p>
        </div>
      </section>

      <main className="max-w-screen-xl mx-auto px-4 py-10 space-y-16">
        {promotionsWithItems.length > 0 ? (
          promotionsWithItems.map(({ promo, items }) => (
            <section key={promo.id}>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-zinc-900">
                  {promo.title}
                </h2>
                {promo.ends_at && (
                  <span className="text-xs text-zinc-400">
                    Expiră: {new Date(promo.ends_at).toLocaleDateString("ro-RO")}
                  </span>
                )}
              </div>
              {promo.description && (
                <p className="text-sm text-zinc-500 mb-4">{promo.description}</p>
              )}
              {items.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {items.map((item) => {
                    const p = item.product as import("@/types/database").ProductListing | undefined;
                    if (!p) return null;
                    const originalPrice = p.display_price;
                    const discountedPrice = item.discount_price
                      ? item.discount_price
                      : item.discount_pct
                        ? originalPrice * (1 - item.discount_pct / 100)
                        : originalPrice;
                    const priceStr = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(discountedPrice);
                    const originalStr = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(originalPrice);

                    return (
                      <Link key={item.id} href={`/produse/${p.slug}`} className="shrink-0 w-44 group">
                        <div className="relative w-full aspect-square rounded-xl bg-zinc-100 mb-2.5 overflow-hidden">
                          {p.primary_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
                          )}
                          {item.discount_pct && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                              -{Math.round(item.discount_pct)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-700 leading-snug line-clamp-2 group-hover:text-black transition-colors">{p.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <p className="text-sm font-bold text-red-600">{priceStr} RON</p>
                          {(item.discount_pct || item.discount_price) && (
                            <p className="text-xs text-zinc-400 line-through">{originalStr}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">Niciun produs în această promoție încă.</p>
              )}
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-bold text-zinc-700 mb-2">Nicio promoție activă momentan</p>
            <p className="text-sm text-zinc-400 mb-6">Revino în curând pentru oferte exclusive.</p>
            <Link href="/produse" className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors">
              Toate produsele
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

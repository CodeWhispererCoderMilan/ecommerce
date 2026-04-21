import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import NavbarWrapper from "@/components/NavbarWrapper";
import { getNewProducts } from "@/lib/promotions";
import type { ProductListing } from "@/types/database";

export const metadata: Metadata = { title: "Noutăți | NexusX" };

export default async function NoutatiPage() {
  const products = await getNewProducts(48).catch(() => [] as ProductListing[]);

  return (
    <>
      <NavbarWrapper />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-950 via-zinc-900 to-zinc-950 py-16 px-4">
        <div className="max-w-screen-xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
            <Link href="/" className="hover:text-zinc-300">Acasă</Link>
            <span>/</span>
            <span className="text-white">Noutăți</span>
          </nav>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white uppercase leading-none">
            NOUTĂȚI
          </h1>
          <p className="text-zinc-400 text-sm mt-3">{products.length} produse noi disponibile</p>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-screen-xl mx-auto px-4 py-10">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-bold text-zinc-700 mb-2">Niciun produs nou momentan</p>
            <p className="text-sm text-zinc-400 mb-6">Revino în curând pentru ultimele apariții.</p>
            <Link href="/produse" className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors">
              Toate produsele
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

function ProductCard({ product: p }: { product: ProductListing }) {
  const badge = p.display_badge ?? p.badge;
  const priceStr = p.display_price > 0
    ? new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(p.display_price) + " RON"
    : "—";

  return (
    <Suspense fallback={null}>
      <Link href={`/produse/${p.slug}`} className="group">
        <div className="relative w-full aspect-square rounded-xl bg-zinc-100 mb-2.5 overflow-hidden">
          {p.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
          )}
          {badge && (
            <span className={`absolute top-2 left-2 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${badge === "NOU" ? "bg-blue-600" : badge === "LIMITAT" ? "bg-red-600" : "bg-green-600"}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-700 leading-snug line-clamp-2 group-hover:text-black transition-colors">{p.name}</p>
        <p className="text-sm font-bold text-zinc-900 mt-1">{priceStr}</p>
        <p className={`text-[10px] font-semibold mt-0.5 ${p.in_stock ? "text-green-600" : "text-red-500"}`}>
          {p.in_stock ? "● În stoc" : "● Stoc epuizat"}
        </p>
      </Link>
    </Suspense>
  );
}

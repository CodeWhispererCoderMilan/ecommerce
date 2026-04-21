import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import NavbarWrapper    from "@/components/NavbarWrapper";
import BrandMarquee     from "@/components/BrandMarquee";
import ProductGallery   from "./ProductGallery";
import ProductInfo      from "./ProductInfo";
import ProductTabs      from "./ProductTabs";
import StickyBar        from "./StickyBar";
import RelatedProducts  from "./RelatedProducts";

// ── Dynamic metadata ─────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produs negăsit" };
  return {
    title: `${product.name} | NexusX`,
    description: product.description?.slice(0, 160) ?? product.name,
  };
}

// ── Page ─────────────────────────────────────────────────────

export default async function ProductPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = product.category?.slug
    ? await getRelatedProducts(product.category.slug, slug, 4)
    : [];

  const priceStr = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: 2,
  }).format(product.base_price);

  return (
    <>
      <NavbarWrapper />
      <main className="max-w-screen-xl mx-auto px-4 py-8 pb-28">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-zinc-700 transition-colors">Acasă</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/produse?categorie=${product.category.slug}`}
                className="hover:text-zinc-700 transition-colors capitalize"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          {product.brand && (
            <>
              <Link
                href={`/produse?brand=${product.brand.slug}`}
                className="hover:text-zinc-700 transition-colors"
              >
                {product.brand.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-zinc-600 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Top section: gallery + info ── */}
        <div className="grid lg:grid-cols-[1fr_480px] gap-10 xl:gap-16 items-start">

          {/* Gallery */}
          <div className="lg:sticky lg:top-24">
            <ProductGallery
              productImages={product.images}
              variants={product.variants}
              productName={product.name}
            />
          </div>

          {/* Product info */}
          <ProductInfo product={product} />
        </div>

        {/* ── Tabs: description / reviews / questions ── */}
        <ProductTabs product={product} />

        {/* ── Trust badges ── */}
        <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-zinc-100">
          {[
            {
              icon: "💳",
              title: "Plată în rate",
              sub: "2 sau 4 rate fără dobândă",
            },
            {
              icon: "🚀",
              title: "Expediem azi",
              sub: "Comandă până la ora 16:00",
            },
            {
              icon: "🔄",
              title: "Returnare 30 zile",
              sub: "Fără întrebări",
            },
            {
              icon: "💬",
              title: "Suport rapid",
              sub: "Echipă dedicată gameri",
            },
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

        {/* ── Related products ── */}
        <RelatedProducts products={related} />

      </main>

      <BrandMarquee />

      {/* ── Footer ── */}
      <footer className="bg-zinc-950 text-white pt-14 pb-6">
        <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-800">
          <div>
            <p className="font-display font-black text-xl mb-1">
              NEXUS<span className="text-red-600">X</span>
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed mt-2">
              Magazinul tău dedicat gamingului competitiv.
            </p>
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
              <input
                type="email"
                placeholder="Email-ul tău"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
              <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors">
                Go
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-4 pt-8 text-center">
          <p className="font-display font-black text-4xl md:text-6xl text-zinc-800 uppercase tracking-tighter select-none">
            MAGAZINUL TĂU DE ESPORT
          </p>
          <p className="text-zinc-600 text-xs mt-4">© 2026 NexusX · Termeni · Confidențialitate</p>
        </div>
      </footer>

      {/* ── Sticky add-to-cart bar (client, appears on scroll) ── */}
      <StickyBar product={product} />
    </>
  );
}

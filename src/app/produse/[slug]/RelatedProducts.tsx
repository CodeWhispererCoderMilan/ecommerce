import Link from "next/link";
import type { ProductListing } from "@/types/database";

interface Props {
  products: ProductListing[];
}

export default function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-zinc-100">
      <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-6">
        S-ar putea să-ți placă și
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => {
          const priceStr = new Intl.NumberFormat("ro-RO", {
            minimumFractionDigits: 2,
          }).format(p.display_price);

          return (
            <Link
              key={p.id}
              href={`/produse/${p.slug}`}
              className="group flex flex-col"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 mb-3">
                {p.primary_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primary_image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100" />
                )}
              </div>
              <p className="text-xs text-zinc-400 mb-1">{p.brand_name}</p>
              <p className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors mb-2">
                {p.name}
              </p>
              <p className="text-base font-black text-zinc-900 mt-auto">
                {priceStr} <span className="text-xs font-semibold text-zinc-500">RON</span>
              </p>
              <p className={`text-[11px] font-semibold mt-0.5 ${p.in_stock ? "text-green-600" : "text-red-500"}`}>
                {p.in_stock ? "● În stoc" : "● Stoc epuizat"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

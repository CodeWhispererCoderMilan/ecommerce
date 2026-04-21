import { getBrands } from "@/lib/brands";

export default async function BrandMarquee() {
  let names: string[] = [];
  try {
    const brands = await getBrands();
    names = brands.map((b) => b.name);
  } catch {
    names = ["Keychron", "Akko", "Epomaker", "Varmilo", "Monsgeek", "GuliKit", "Hori"];
  }

  if (names.length === 0) return null;

  // Repeat to fill the track — needs 32+ items so the -50% translate loops seamlessly
  const fill = Math.max(1, Math.ceil(32 / names.length));
  const track = Array(fill).fill(names).flat();

  return (
    <div className="bg-zinc-950 py-3 overflow-hidden border-y border-zinc-800">
      <div className="flex animate-marquee whitespace-nowrap">
        {track.map((n, i) => (
          <span
            key={i}
            className="font-display font-black text-zinc-500 uppercase tracking-[0.3em] text-sm mx-8"
          >
            {n}
          </span>
        ))}
        {track.map((n, i) => (
          <span
            key={"b" + i}
            className="font-display font-black text-zinc-500 uppercase tracking-[0.3em] text-sm mx-8"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

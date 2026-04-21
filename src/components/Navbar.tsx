"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/* ─── Announcement messages ─────────────────────────────────── */

const ANNOUNCEMENTS = [
  "Plată în 2 sau 4 rate fără dobândă 🔥",
  "Livrare gratuită pentru comenzi peste 150€ 🚀",
  "Returnare gratuită în 30 de zile 🔄",
  "Suport dedicat gameri 7 zile din 7 💬",
];

/* ─── Nav data ─────────────────────────────────────────────── */

type NavItem = { name: string; href: string; badge?: "NOU" | "OFERTĂ" };
type NavGroup = { title: string; href?: string; items: NavItem[] };
type NavCategory = {
  label: string;
  href: string;
  columns: NavGroup[][];
  featured: { brand: string; product: string; gradient: string; href: string };
};

const NAV: NavCategory[] = [
  {
    label: "Periferice",
    href: "/produse?categorie=tastaturi,mouse-uri",
    columns: [
      [
        {
          title: "TASTATURI GAMING",
          href: "/produse?categorie=tastaturi",
          items: [
            { name: "Magnetice",  href: "/produse?categorie=tastaturi&tip=magnetica",  badge: "NOU" },
            { name: "Mecanice",   href: "/produse?categorie=tastaturi&tip=mecanica" },
            { name: "Membrane",   href: "/produse?categorie=tastaturi&tip=membrana" },
            { name: "Hot-Swap",   href: "/produse?categorie=tastaturi&hot_swap=true" },
          ],
        },
      ],
      [
        {
          title: "MOUSE-URI",
          href: "/produse?categorie=mouse-uri",
          items: [
            { name: "Mouse Simple", href: "/produse?categorie=mouse-uri&tip=simplu" },
            { name: "Mouse 8K",     href: "/produse?categorie=mouse-uri&tip=8k", badge: "NOU" },
          ],
        },
      ],
    ],
    featured: { brand: "Keychron", product: "K10 HE Magnetic", gradient: "from-zinc-900 to-zinc-700", href: "/produse?categorie=tastaturi&tip=magnetica" },
  },
  {
    label: "Console",
    href: "/produse?categorie=controllere,volan-gaming",
    columns: [
      [
        {
          title: "CONTROLLERE",
          href: "/produse?categorie=controllere",
          items: [
            { name: "PC / Nintendo Switch", href: "/produse?categorie=controllere&platforma=pc-switch", badge: "NOU" },
            { name: "PlayStation",          href: "/produse?categorie=controllere&platforma=playstation" },
            { name: "Xbox",                 href: "/produse?categorie=controllere&platforma=xbox" },
            { name: "Multi-platform",       href: "/produse?categorie=controllere&platforma=multi" },
          ],
        },
      ],
      [
        {
          title: "VOLAN GAMING",
          href: "/produse?categorie=volan-gaming",
          items: [
            { name: "PS5 / PS4",       href: "/produse?categorie=volan-gaming&platforma=playstation" },
            { name: "Xbox",            href: "/produse?categorie=volan-gaming&platforma=xbox" },
            { name: "Nintendo Switch", href: "/produse?categorie=volan-gaming&platforma=switch" },
            { name: "PC",              href: "/produse?categorie=volan-gaming&platforma=pc" },
          ],
        },
      ],
    ],
    featured: { brand: "GuliKit", product: "KK3 MAX Controller", gradient: "from-zinc-900 to-blue-950", href: "/produse?categorie=controllere" },
  },
  {
    label: "Accesorii",
    href: "/produse?categorie=accesorii",
    columns: [
      [
        {
          title: "MOUSEPAD-URI",
          href: "/produse?categorie=accesorii&tip=mousepad",
          items: [
            { name: "XL (90×40 cm)", href: "/produse?categorie=accesorii&tip=mousepad&marime=xl" },
            { name: "Standard",      href: "/produse?categorie=accesorii&tip=mousepad&marime=standard" },
          ],
        },
      ],
      [
        {
          title: "SWITCH-URI",
          href: "/produse?categorie=accesorii&tip=switch",
          items: [
            { name: "Silentioase", href: "/produse?categorie=accesorii&tip=switch&subtip=silent" },
            { name: "Clicky",      href: "/produse?categorie=accesorii&tip=switch&subtip=clicky" },
            { name: "Linear",      href: "/produse?categorie=accesorii&tip=switch&subtip=linear" },
          ],
        },
        {
          title: "ALTE ACCESORII",
          href: "/produse?categorie=accesorii",
          items: [
            { name: "Folii Protectie",         href: "/produse?categorie=accesorii&tip=folie" },
            { name: "Huse & Carcase",          href: "/produse?categorie=accesorii&tip=husa" },
            { name: "Standuri & Incarcatoare", href: "/produse?categorie=accesorii&tip=stand" },
          ],
        },
      ],
    ],
    featured: { brand: "Varmilo", product: "XL Deep Space Mousepad", gradient: "from-slate-900 to-slate-700", href: "/produse?categorie=accesorii&tip=mousepad" },
  },
];

/* ─── Component ────────────────────────────────────────────── */

interface Props {
  user: User | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
}

export default function Navbar({ user, isAdmin, onOpenAuth }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Announcement ticker
  const annIdxRef = useRef(0);
  const [annIdx, setAnnIdx] = useState(0);
  const [exitingAnnIdx, setExitingAnnIdx] = useState<number | null>(null);

  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // User dropdown click-outside
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    // Announcement cycling
    const interval = setInterval(() => {
      const current = annIdxRef.current;
      const next = (current + 1) % ANNOUNCEMENTS.length;
      setExitingAnnIdx(current);
      setAnnIdx(next);
      annIdxRef.current = next;
      setTimeout(() => setExitingAnnIdx(null), 450);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserDropdownOpen(false);
  }

  const initial = user?.email?.[0].toUpperCase() ?? "";

  return (
    <header className="sticky top-0 z-50">

      {/* ── Announcement bar ── */}
      <div className="h-8 flex items-center justify-center overflow-hidden relative bg-black" style={{ backgroundImage: "url('/patterns/wavy-contour-background-topographic-contour-background-contour-lines-background-topographic-map-background-abstract-wavy-background-vector.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/60" />
        {exitingAnnIdx !== null && (
          <span key={`out-${exitingAnnIdx}`} className="absolute z-10 text-xs font-medium text-white/80 animate-ticker-out">
            {ANNOUNCEMENTS[exitingAnnIdx]}
          </span>
        )}
        <span key={`in-${annIdx}`} className="absolute z-10 text-xs font-medium text-white/80 animate-ticker-in">
          {ANNOUNCEMENTS[annIdx]}
        </span>
      </div>

      {/* ── Main nav ── */}
      <div className="bg-zinc-900 border-b border-zinc-700">
        <div className="max-w-screen-xl mx-auto px-4 h-14 grid grid-cols-3 items-center gap-4">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button className="md:hidden text-zinc-300 hover:text-white" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </button>
            <Link href="/" className="font-display font-black text-2xl tracking-tighter text-white">
              NEXUS<span className="text-red-500">X</span>
            </Link>
          </div>

          {/* Center: search — placeholder, wired up when search page exists */}
          <div className="hidden sm:flex justify-center">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Caută produse..."
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3.5 py-1.5 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <SearchIcon />
              </span>
            </div>
          </div>

          {/* Right: promo links + icons */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/promotii" className="hidden lg:block text-xs font-display font-bold text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors">
              Promoții
            </Link>
            <Link href="/noutati" className="hidden lg:block text-xs font-display font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
              Noutăți
            </Link>

            {isAdmin && (
              <Link href="/admin" className="hidden lg:block text-xs font-display font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">
                Admin
              </Link>
            )}

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-600 hover:bg-zinc-500 text-white text-sm font-semibold transition-colors"
                >
                  {initial}
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 bg-white shadow-lg py-1.5 z-50">
                    <p className="px-3 py-1 text-xs text-zinc-400 truncate">{user.email}</p>
                    <hr className="border-zinc-100 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      Deconectare
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onOpenAuth} className="text-zinc-300 hover:text-white transition-colors p-1">
                <UserIcon />
              </button>
            )}

            <button className="relative text-zinc-300 hover:text-white transition-colors p-1">
              <CartIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category bar + mega dropdown ── */}
      <div
        className="bg-zinc-900 border-b border-zinc-700 relative hidden md:block"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex justify-center h-10">
            {NAV.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                onMouseEnter={() => setActiveCategory(cat.label)}
                className={`px-6 h-full flex items-center text-xs font-display font-bold uppercase tracking-widest transition-colors border-b-2 ${
                  activeCategory === cat.label
                    ? "text-white border-white"
                    : "text-zinc-400 border-transparent hover:text-white"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mega dropdown — white */}
        {activeCategory && (() => {
          const cat = NAV.find((c) => c.label === activeCategory)!;
          return (
            <div className="absolute left-0 right-0 top-full bg-white border-t border-zinc-200 shadow-2xl">
              <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-8">
                <div className="flex flex-1 gap-10">
                  {cat.columns.map((column, ci) => (
                    <div key={ci} className="flex flex-col gap-5 min-w-[160px]">
                      {column.map((group) => (
                        <div key={group.title}>
                          <div className="flex items-center gap-1 mb-2">
                            {group.href ? (
                              <Link href={group.href} className="text-xs font-display font-bold tracking-wider text-black hover:text-zinc-600 transition-colors flex items-center gap-1">
                                {group.title}
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M3 9L9 3M9 3H4M9 3v5" />
                                </svg>
                              </Link>
                            ) : (
                              <span className="text-xs font-display font-bold tracking-wider text-black">{group.title}</span>
                            )}
                          </div>
                          <ul className="space-y-1.5">
                            {group.items.map((item) => (
                              <li key={item.name}>
                                <Link href={item.href} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-black transition-colors">
                                  {item.name}
                                  {item.badge && (
                                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Link href={cat.featured.href} className={`w-52 rounded-xl bg-gradient-to-br ${cat.featured.gradient} p-4 flex flex-col justify-end shrink-0 group`}>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{cat.featured.brand}</p>
                  <p className="text-sm font-display font-bold text-white leading-tight">{cat.featured.product}</p>
                  <span className="mt-3 inline-block bg-white/10 group-hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors w-fit">
                    Descoperă →
                  </span>
                </Link>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-80 max-w-full bg-zinc-900 h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
              <span className="font-display font-black text-xl text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-white">
                <CloseIcon />
              </button>
            </div>
            <div className="px-5 py-4 space-y-1">
              <a href="#" className="block text-sm font-bold text-red-400 uppercase tracking-widest py-2">Promoții</a>
              <a href="#" className="block text-sm font-bold text-blue-400 uppercase tracking-widest py-2">Noutăți</a>
              <hr className="border-zinc-700 my-2" />
              {NAV.map((cat) => (
                <div key={cat.label}>
                  <button
                    className="w-full flex items-center justify-between py-3 text-sm font-display font-bold uppercase tracking-wider text-white"
                    onClick={() => setMobileExpanded(mobileExpanded === cat.label ? null : cat.label)}
                  >
                    {cat.label}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className={`transition-transform text-zinc-400 ${mobileExpanded === cat.label ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {mobileExpanded === cat.label && (
                    <div className="pl-3 pb-2 space-y-3">
                      {cat.columns.flat().map((group) => (
                        <div key={group.title}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{group.title}</p>
                          {group.items.map((item) => (
                            <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-white py-0.5 transition-colors">
                              {item.name}
                              {item.badge && <span className="ml-1.5 bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">{item.badge}</span>}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <hr className="border-zinc-700" />
                </div>
              ))}
            </div>
            <div className="px-5 pb-6">
              {user ? (
                <button onClick={handleSignOut} className="text-sm text-zinc-400 hover:text-white py-2 transition-colors">
                  Deconectare
                </button>
              ) : (
                <button onClick={() => { onOpenAuth(); setMobileOpen(false); }} className="text-sm text-zinc-400 hover:text-white py-2 transition-colors">
                  Contul meu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Icons ─────────────────────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

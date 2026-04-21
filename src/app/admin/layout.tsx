"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAdminStatus } from "@/lib/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"loading" | "denied" | "ok">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/"); return; }
      setEmail(user.email ?? "");
      const { isAdmin, userId: uid } = await getAdminStatus();
      setUserId(uid);
      setStatus(isAdmin ? "ok" : "denied");
    }
    check();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Verificare acces admin…</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Acces interzis</h1>
          <p className="text-sm text-zinc-500 mb-4">
            Contul tău nu are permisiuni de administrator.
          </p>
          {userId && (
            <div className="bg-zinc-50 rounded-xl p-4 text-left mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">UUID-ul tău Supabase</p>
              <p className="text-xs font-mono text-zinc-700 break-all">{userId}</p>
              <p className="text-[10px] text-zinc-400 mt-2">
                Rulează în Supabase SQL Editor:
              </p>
              <pre className="text-[10px] bg-zinc-900 text-green-400 rounded-lg p-2 mt-1 overflow-x-auto">
                {`INSERT INTO admin_users (id)\nVALUES ('${userId}')\nON CONFLICT DO NOTHING;`}
              </pre>
            </div>
          )}
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Înapoi la magazin</Link>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: "/admin",
      label: "Produse",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      href: "/admin/products/new",
      label: "Produs nou",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
    },
    {
      href: "/admin/brands",
      label: "Branduri",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    },
    {
      href: "/admin/categories",
      label: "Categorii",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
    },
    {
      href: "/admin/homepage",
      label: "Homepage",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      href: "/admin/promotions",
      label: "Promoții",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-zinc-950 flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <Link href="/" className="font-display font-black text-xl text-white">
            NEXUS<span className="text-red-600">X</span>
          </Link>
          <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-widest">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 truncate mb-2">{email}</p>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}
            className="w-full text-xs text-zinc-400 hover:text-white py-1.5 transition-colors text-left"
          >
            Deconectare →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

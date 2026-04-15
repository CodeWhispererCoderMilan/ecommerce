"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Props {
  user: User | null;
  onOpenAuth: () => void;
}

export default function Navbar({ user, onOpenAuth }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setDropdownOpen(false);
  }

  const initial = user?.email?.[0].toUpperCase() ?? "";

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <span className="font-semibold tracking-tight">Shop</span>

      {user ? (
        <div className="relative" ref={ref}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            {initial}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-lg border border-zinc-200 bg-white shadow-md py-1 z-50">
              <p className="px-3 py-1.5 text-xs text-zinc-400 truncate">{user.email}</p>
              <hr className="border-zinc-100 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <button onClick={onOpenAuth} className="text-zinc-500 hover:text-black transition-colors">
          <UserIcon />
        </button>
      )}
    </nav>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

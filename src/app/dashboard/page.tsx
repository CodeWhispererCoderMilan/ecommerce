"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!user) return null;

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="space-y-4 text-center">
        <p className="text-zinc-500 text-sm">{user.email}</p>
        <button
          onClick={handleSignOut}
          className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

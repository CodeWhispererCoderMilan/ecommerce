"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";

export default function NavbarWrapper() {
  const [user, setUser]         = useState<User | null>(null);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted]   = useState(false);

  async function checkAdmin(userId: string | undefined) {
    if (!userId) { setIsAdmin(false); return; }
    const { data } = await supabase.from("admin_users").select("id").eq("id", userId).maybeSingle();
    setIsAdmin(!!data);
  }

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      checkAdmin(session?.user?.id);
      if (session) setModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) return <Navbar user={null} isAdmin={false} onOpenAuth={() => {}} />;

  return (
    <>
      <Navbar user={user} isAdmin={isAdmin} onOpenAuth={() => setModalOpen(true)} />
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) setModalOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!hasMounted) return <Navbar user={null} onOpenAuth={() => {}} />;

  return (
    <>
      <Navbar user={user} onOpenAuth={() => setModalOpen(true)} />
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

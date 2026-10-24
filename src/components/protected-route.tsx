"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

/** Preserve the original browser-session guard and keep protected views unmounted until verified. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    setVerified(false);

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) router.replace("/auth");
      else setVerified(true);
    }).catch(() => {
      if (active) router.replace("/auth");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) {
        setVerified(false);
        router.replace("/auth");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return verified ? <>{children}</> : null;
}

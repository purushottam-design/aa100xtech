"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { loginHref } from "@/lib/auth-navigation";

/** Preserve the original browser-session guard and keep protected views unmounted until verified. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    setVerified(false);
    const redirectToLogin = () => {
      router.replace(
        loginHref(window.location.pathname + window.location.search + window.location.hash),
      );
    };

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user) redirectToLogin();
        else setVerified(true);
      })
      .catch(() => {
        if (active) redirectToLogin();
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) {
        setVerified(false);
        redirectToLogin();
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return verified ? (
    <>{children}</>
  ) : (
    <p role="status" className="px-4 py-16 text-center text-muted-foreground">
      Checking your login…
    </p>
  );
}

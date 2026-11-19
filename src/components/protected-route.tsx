"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { GuestPagePreview } from "@/components/guest-page-preview";

/** Guests see a separate preview; protected views stay unmounted until verified. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<{
    path: string;
    state: "member" | "guest" | "error";
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    let authChanged = false;
    setAccess(null);

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active || authChanged) return;
        setAccess({
          path: pathname,
          state:
            error &&
            error.status !== 401 &&
            error.status !== 403 &&
            error.name !== "AuthSessionMissingError"
              ? "error"
              : !error && data.user
                ? "member"
                : "guest",
        });
      })
      .catch(() => {
        if (active && !authChanged) setAccess({ path: pathname, state: "error" });
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event !== "INITIAL_SESSION") {
        authChanged = true;
        setAccess(session ? null : { path: pathname, state: "guest" });
        if (session) setAttempt((value) => value + 1);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, attempt]);

  if (access?.path === pathname && access.state === "guest")
    return <GuestPagePreview pathname={pathname} />;
  if (access?.path === pathname && access.state === "error")
    return (
      <div role="alert" className="space-y-3 px-4 py-16 text-center">
        <p>Unable to check your session. Please try again.</p>
        <button className="text-primary underline" onClick={() => setAttempt((value) => value + 1)}>
          Retry
        </button>
      </div>
    );
  return access?.path === pathname && access.state === "member" ? (
    <>{children}</>
  ) : (
    <p role="status" className="px-4 py-16 text-center text-muted-foreground">
      Checking your login…
    </p>
  );
}

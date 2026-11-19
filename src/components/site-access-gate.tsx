"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { isPublicPage } from "@/lib/auth-navigation";

export function SiteAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // This entry is an availability notice, not an implemented private workspace.
  // Do not let an unrelated session/network error hide its setup blockers.
  return pathname === "/partner-workspace" || isPublicPage(pathname) ? (
    <>{children}</>
  ) : (
    <ProtectedRoute key={pathname}>{children}</ProtectedRoute>
  );
}

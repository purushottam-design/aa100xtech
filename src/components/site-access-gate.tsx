"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { isPublicPage } from "@/lib/auth-navigation";

export function SiteAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Workspace layout checks the shared session and approved Partners membership.
  // API authorization and database RLS independently protect every operation.
  const workspace = pathname === "/partner-workspace" || pathname.startsWith("/partner-workspace/");
  return workspace || isPublicPage(pathname) ? (
    <>{children}</>
  ) : (
    <ProtectedRoute key={pathname}>{children}</ProtectedRoute>
  );
}

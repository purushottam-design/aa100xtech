"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { isPublicPage } from "@/lib/auth-navigation";

export function SiteAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isPublicPage(pathname) ? (
    <>{children}</>
  ) : (
    <ProtectedRoute key={pathname}>{children}</ProtectedRoute>
  );
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ConsultationProvider } from "@/components/consultation-booking";
import { CurrencyProvider } from "@/components/currency-provider";
import { ExpertCta } from "@/components/expert-cta";
import { ScrollReveals } from "@/components/scroll-reveals";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const isMobileApp = pathname === "/app" || pathname.startsWith("/app/");

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ScrollReveals />
        <ConsultationProvider>
          {isMobileApp ? (
            children
          ) : (
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              {(pathname === "/" ||
                pathname === "/services" ||
                pathname === "/about" ||
                pathname === "/founders" ||
                pathname === "/influencer-marketing" ||
                pathname === "/portfolio" ||
                /^\/services\/[^/]+$/.test(pathname)) && <ExpertCta />}
              <SiteFooter />
            </div>
          )}
        </ConsultationProvider>
        <Toaster />
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

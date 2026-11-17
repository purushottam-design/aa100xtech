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
import { SiteAccessGate } from "@/components/site-access-gate";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ScrollReveals />
        <ConsultationProvider>
          <div className="flex min-h-screen flex-col">
            <a
              href="#main-content"
              className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-background px-4 py-3 font-semibold text-foreground shadow-lg focus:not-sr-only"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="flex-1">
              <SiteAccessGate>{children}</SiteAccessGate>
            </main>
            {(pathname === "/" ||
              pathname === "/services" ||
              pathname === "/about" ||
              pathname === "/founders" ||
              pathname === "/influencer-marketing" ||
              pathname === "/portfolio" ||
              /^\/services\/[^/]+$/.test(pathname)) && <ExpertCta />}
            <SiteFooter />
          </div>
        </ConsultationProvider>
        <Toaster />
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

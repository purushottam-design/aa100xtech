"use client";
import { useQuery } from "@tanstack/react-query";
import { site } from "@/data/site";
type PublicSettings = Pick<
  typeof site,
  "name" | "legalName" | "email" | "phone" | "phoneHref" | "address" | "hours"
>;
export function usePublicSite() {
  const result = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const r = await fetch("/api/website/settings");
      if (!r.ok) throw new Error("Settings unavailable");
      return (await r.json()) as PublicSettings;
    },
    staleTime: 60_000,
    retry: false,
  });
  return { ...site, ...result.data };
}

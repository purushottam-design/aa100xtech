import { createFileRoute } from "@tanstack/react-router";

import { services } from "@/data/services";

const BASE_URL = "https://aa100xtech.com";

const staticPaths = [
  "/",
  "/about",
  "/services",
  "/services/explore",
  "/clients",
  "/portfolio",
  "/be-the-one",
  "/creator-moves-365",
  "/influencer-success-program",
  "/influencer-marketing",
  "/founders",
  "/careers",
  "/careers/london",
  "/partners",
  "/partners/plans",
  "/partners/apply",
  "/affiliates",
  "/real-estate",
  "/consultation",
  "/contact",
];

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!,
  );
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const paths = [
          ...staticPaths,
          ...services.map((service) => `/services/${service.slug}`),
        ];
        const urls = [...new Set(paths)]
          .map((path) => `<url><loc>${escapeXml(new URL(path, BASE_URL).href)}</loc></url>`)
          .join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

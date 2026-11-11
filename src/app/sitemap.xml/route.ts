import { services } from "@/data/services";
import { serviceTypes } from "@/data/service-types";
import { marketingServices, marketingServiceHref } from "@/data/marketing-services";
import { listPublishedInfluencers } from "@/lib/influencers.server";
import { publishedBlog } from "@/lib/published-content.server";

const BASE_URL = "https://aa100xtech.com";

const staticPaths = [
  "/",
  "/about",
  "/business-plans",
  "/proposal",
  "/influencer-partners",
  "/join-us/influencer",
  "/blog",
  "/services",
  "/services/explore",
  "/clients",
  "/portfolio",
  "/be-the-one",
  "/creator-moves-365",
  "/influencer-success-program",
  "/influencer-marketing",
  "/influencer-marketing/for-brands",
  "/influencer-marketing/for-influencers",
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
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}

export const dynamic = "force-dynamic";
export const GET = async () => {
  const { profiles } = await listPublishedInfluencers();
  const { rows: articles } = await publishedBlog();
  const paths = [
    ...staticPaths,
    ...marketingServices.map(marketingServiceHref),
    ...services.map((service) => `/services/${service.slug}`),
    ...serviceTypes.map((service) => `/services/explore/${service.slug}`),
    ...profiles.map((profile) => `/influencers/${profile.slug}`),
    ...articles.map((article) => `/blog/${article.slug}`),
  ];
  const urls = [...new Set(paths)]
    .map((path) => `<url><loc>${escapeXml(new URL(path, BASE_URL).href)}</loc></url>`)
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store",
    },
  });
};

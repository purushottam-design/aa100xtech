import { serviceBySlug } from "@/data/services";
import { fromLegacyHead } from "@/lib/page-metadata";

const head = ({
  loaderData,
}: {
  loaderData?: { service: NonNullable<ReturnType<typeof serviceBySlug>> };
}) => {
  if (!loaderData) {
    return {
      meta: [{ title: "Service not found — AA100XTech" }, { name: "robots", content: "noindex" }],
    };
  }
  const t = `${loaderData.service.title} — AA100XTech`;
  const d = loaderData.service.short;
  return {
    meta: [
      { title: t },
      { name: "description", content: d },
      { property: "og:title", content: t },
      { property: "og:description", content: d },
    ],
  };
};

export function detailMetadata(service?: NonNullable<ReturnType<typeof serviceBySlug>>) {
  const metadata = fromLegacyHead(head(service ? { loaderData: { service } } : {}));
  if (!service) return metadata;
  const url = `https://aa100xtech.com/services/${service.slug}`;
  return {
    ...metadata,
    alternates: { canonical: url },
    openGraph: { ...metadata.openGraph, url },
    twitter: {
      card: "summary_large_image" as const,
      title: service.title,
      description: service.short,
    },
  };
}

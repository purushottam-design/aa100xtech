import { serviceBySlug } from "@/data/services";
import { fromLegacyHead } from "@/lib/page-metadata";

const head = ({ loaderData }: { loaderData?: { service: NonNullable<ReturnType<typeof serviceBySlug>> } }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — AA100XTech" }, { name: "robots", content: "noindex" }] };
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
  return fromLegacyHead(head(service ? { loaderData: { service } } : {}));
}

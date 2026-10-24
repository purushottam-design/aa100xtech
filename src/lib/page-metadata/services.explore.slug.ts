import { serviceTypeBySlug } from "@/data/service-types";
import { fromLegacyHead } from "@/lib/page-metadata";

const head = ({ loaderData }: { loaderData?: { type: NonNullable<ReturnType<typeof serviceTypeBySlug>> } }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Service type not found — AA100XTech" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const t = `${loaderData.type.title} — How It Works & Pricing | AA100XTech`;
    const d = loaderData.type.description.slice(0, 155);
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  };

export function detailMetadata(type?: NonNullable<ReturnType<typeof serviceTypeBySlug>>) {
  return fromLegacyHead(head(type ? { loaderData: { type } } : {}));
}

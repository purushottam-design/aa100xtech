"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPublicContent } from "@/lib/super-admin-plus.functions";
import { safePublicUrl } from "@/lib/public-links";
type PublicBlock = {
  id: string;
  block_type: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
};
export function CmsSections({ placement }: { placement: string }) {
  const query = useQuery({
    queryKey: ["public-content", placement],
    queryFn: () => getPublicContent({ data: { placement } }),
    staleTime: 60_000,
  });
  const rows = (query.data?.rows ?? []) as PublicBlock[];
  if (!rows.length) return null;
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2">
      {rows.map((row) => (
        <article key={row.id} className="surface-card overflow-hidden p-6">
          {safePublicUrl(row.image_url) && (
            <img
              src={safePublicUrl(row.image_url)}
              alt={row.title}
              loading="lazy"
              className="mb-5 aspect-video w-full rounded-lg object-cover"
            />
          )}
          <h2 className="text-2xl font-semibold">{row.title}</h2>
          {row.subtitle && <p className="mt-3 text-muted-foreground">{row.subtitle}</p>}
          {row.body && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{row.body}</p>
          )}
          {row.block_type === "blog" ? (
            <Link href={`/blog/${row.slug}`} className="mt-5 inline-block text-primary underline">
              Read article
            </Link>
          ) : (
            safePublicUrl(row.link_url) && (
              <a
                href={safePublicUrl(row.link_url)}
                className="mt-5 inline-block text-primary underline"
              >
                {row.link_label || "Learn more"}
              </a>
            )
          )}
        </article>
      ))}
    </section>
  );
}

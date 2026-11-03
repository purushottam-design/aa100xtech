import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publishedBlog } from "@/lib/published-content.server";
import { safePublicUrl } from "@/lib/public-links";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = (await publishedBlog(slug)).rows[0];
  return {
    title: row ? `${row.title} | AA100XTech` : "Article unavailable",
    description: row?.subtitle ?? undefined,
    alternates: {
      canonical: `https://aa100xtech.com/blog/${encodeURIComponent(slug)}`,
    },
    openGraph: row
      ? {
          type: "article",
          title: row.title,
          description: row.subtitle ?? undefined,
        }
      : undefined,
  };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { rows, unavailable } = await publishedBlog(slug);
  const row = rows[0];
  if (unavailable)
    return (
      <p role="status" className="mx-auto max-w-3xl px-4 py-16">
        This article is temporarily unavailable. Please try again.
      </p>
    );
  if (!row) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">{row.title}</h1>
      <p className="mt-5 text-lg text-muted-foreground">{row.subtitle}</p>
      {safePublicUrl(row.image_url) && (
        <img
          className="mt-8 aspect-video w-full rounded-xl object-cover"
          src={safePublicUrl(row.image_url)}
          alt={row.title}
        />
      )}
      <div className="mt-8 whitespace-pre-wrap leading-8">{row.body}</div>
    </article>
  );
}

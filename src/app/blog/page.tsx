import { withSocialMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import type { Metadata } from "next";
import { publishedBlog } from "@/lib/published-content.server";
export const dynamic = "force-dynamic";
export const metadata: Metadata = withSocialMetadata({
  title: "Insights | AA100XTech",
  description: "Technology, creative and marketing insights from AA100XTech.",
  alternates: { canonical: "https://aa100xtech.com/blog" },
});
export default async function BlogPage() {
  const { rows, unavailable } = await publishedBlog();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold">Insights from our team</h1>
      <p className="mt-4 text-muted-foreground">Technology, creativity and business growth.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className="surface-card p-6">
            <h2 className="text-2xl font-semibold">
              <Link href={`/blog/${row.slug}`}>{row.title}</Link>
            </h2>
            <p className="mt-3 text-muted-foreground">{row.subtitle}</p>
            <Link href={`/blog/${row.slug}`} className="mt-5 inline-block text-primary underline">
              Read article
            </Link>
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="mt-8" role="status">
          {unavailable
            ? "Articles are temporarily unavailable."
            : "Our next articles will appear here when published."}
        </p>
      )}
    </section>
  );
}

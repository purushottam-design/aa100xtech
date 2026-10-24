import type { Metadata } from "next";

type LegacyMeta = {
  title?: string;
  charSet?: string;
  name?: string;
  property?: string;
  content?: string;
};

export type LegacyHead = {
  meta?: LegacyMeta[];
  links?: Array<{ rel: string; href: string; [key: string]: unknown }>;
};

/** Convert the original SEO fields to native App Router metadata without changing their values. */
export function fromLegacyHead(head: LegacyHead): Metadata {
  const metadata: Metadata = {};
  const openGraph: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  const other: Record<string, string> = {};
  const icons: { icon?: string; apple?: string } = {};

  for (const meta of head.meta ?? []) {
    if (meta.title !== undefined) {
      metadata.title = meta.title;
      continue;
    }
    if (meta.content === undefined) continue;
    const key = meta.name ?? meta.property;
    if (!key) continue;
    if (key.startsWith("og:")) openGraph[key.slice(3)] = meta.content;
    else if (key.startsWith("twitter:")) twitter[key.slice(8)] = meta.content;
    else if (key === "description") metadata.description = meta.content;
    else if (key === "robots") metadata.robots = meta.content;
    else if (key === "author") metadata.authors = [{ name: meta.content }];
    else if (key !== "viewport") other[key] = meta.content;
  }

  // Next.js replaces nested metadata objects instead of merging their fields.
  // The original root route supplied this default for all child pages.
  if (Object.keys(openGraph).length) metadata.openGraph = { type: "website", ...openGraph } as Metadata["openGraph"];
  if (Object.keys(twitter).length) metadata.twitter = twitter as Metadata["twitter"];
  if (Object.keys(other).length) metadata.other = other;

  for (const link of head.links ?? []) {
    if (link.rel === "canonical") metadata.alternates = { canonical: link.href };
    else if (link.rel === "icon") icons.icon = link.href;
    else if (link.rel === "apple-touch-icon") icons.apple = link.href;
    else if (link.rel === "manifest") metadata.manifest = link.href;
  }
  if (Object.keys(icons).length) metadata.icons = icons;

  return metadata;
}

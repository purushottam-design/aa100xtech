import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Facebook,
  Instagram,
  MapPin,
  Youtube,
} from "lucide-react";
import {
  getPublishedInfluencer,
  InfluencerDirectoryUnavailableError,
} from "@/lib/influencers.server";
import { mediaUrl, youtubeEmbed } from "@/lib/influencers";
import { InfluencerShare } from "@/components/influencer-share";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getPublishedInfluencer(slug);
    if (!p) return { title: "Influencer not found | AA100X TECH", robots: { index: false } };
    const url = `https://aa100xtech.com/influencers/${p.slug}`;
    const image = mediaUrl(p.cover_image || p.profile_image);
    return {
      title: `${p.display_name} | Official AA100X TECH Influencer Partner`,
      description: p.biography.slice(0, 160),
      alternates: { canonical: url },
      openGraph: {
        type: "profile",
        title: `${p.display_name} | AA100X TECH`,
        description: p.biography.slice(0, 160),
        url,
        ...(image
          ? { images: [{ url: `https://aa100xtech.com${image}`, alt: p.display_name }] }
          : {}),
      },
    };
  } catch {
    return { title: "Influencer directory | AA100X TECH", robots: { index: false, follow: false } };
  }
}
export default async function InfluencerProfilePage({ params }: Props) {
  const { slug } = await params;
  let profile;
  try {
    profile = await getPublishedInfluencer(slug);
  } catch (error) {
    if (!(error instanceof InfluencerDirectoryUnavailableError)) throw error;
    return (
      <div role="status" className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-3xl font-bold">This influencer profile is temporarily unavailable.</h1>
        <p className="mt-4 text-muted-foreground">Please try again shortly.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/influencers">Back to the program</Link>
        </Button>
      </div>
    );
  }
  if (!profile) notFound();
  const socials = [
    {
      url: profile.socials.instagram,
      count: profile.socials.instagram_followers,
      label: "Instagram",
      Icon: Instagram,
    },
    {
      url: profile.socials.youtube,
      count: profile.socials.youtube_followers,
      label: "YouTube",
      Icon: Youtube,
    },
    {
      url: profile.socials.facebook,
      count: profile.socials.facebook_followers,
      label: "Facebook",
      Icon: Facebook,
    },
  ];
  const structured = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.display_name,
    description: profile.biography,
    url: `https://aa100xtech.com/influencers/${profile.slug}`,
    sameAs: [...socials.filter((s) => s.url).map((s) => s.url), ...profile.socials.other],
    knowsAbout: profile.specialization || profile.category,
  };
  return (
    <div className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <div className="relative h-56 overflow-hidden border-b border-border bg-gradient-to-br from-primary/15 via-background to-secondary sm:h-80">
        {profile.cover_image && (
          <img
            src={mediaUrl(profile.cover_image)}
            alt={`${profile.display_name}'s cover`}
            className="h-full w-full object-cover"
            width={1800}
            height={600}
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/influencers#directory"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> All influencer partners
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-6 border-b border-border pb-9 sm:flex-row">
          <div className="flex items-center gap-5">
            {profile.profile_image ? (
              <img
                src={mediaUrl(profile.profile_image)}
                alt={profile.display_name}
                width={144}
                height={144}
                className="size-24 rounded-2xl border border-primary/30 object-cover sm:size-36"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-4xl text-primary">
                {profile.display_name[0]}
              </div>
            )}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs text-primary">
                <BadgeCheck className="size-4" /> Official AA100X TECH Partner
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {profile.display_name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{profile.category}</p>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {profile.city}, {profile.state}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <InfluencerShare name={profile.display_name} />
            {profile.portfolio_url && (
              <Button asChild>
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                  View Portfolio <ArrowUpRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0 space-y-10">
            <section>
              <h2 className="text-2xl font-semibold">About {profile.display_name}</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {profile.biography}
              </p>
              {profile.specialization && (
                <p className="mt-4 text-sm">
                  <span className="font-medium">Content niche:</span> {profile.specialization}
                </p>
              )}
            </section>
            {[
              ["Creator journey", profile.journey],
              ["Public achievements", profile.achievements],
              ["Let’s collaborate", profile.collaboration_intro],
              ["Partnership with AA100X TECH", profile.partnership_description],
            ].map(([heading, body]) =>
              body ? (
                <section key={heading}>
                  <h2 className="text-2xl font-semibold">{heading}</h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {body}
                  </p>
                </section>
              ) : null,
            )}
            {(profile.gallery.length > 0 || profile.video_urls.length > 0) && (
              <section>
                <h2 className="text-2xl font-semibold">Content & portfolio</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {profile.gallery.map((path, i) => (
                    <img
                      key={path}
                      src={mediaUrl(path)}
                      alt={`Approved work by ${profile.display_name}, image ${i + 1}`}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
                <div className="mt-5 space-y-5">
                  {profile.video_urls.map((url, i) => {
                    const embed = youtubeEmbed(url);
                    return embed ? (
                      <iframe
                        key={url}
                        src={embed}
                        title={`${profile.display_name} portfolio video ${i + 1}`}
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        allowFullScreen
                        className="aspect-video w-full rounded-xl border border-border"
                      />
                    ) : (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-sm text-primary underline"
                      >
                        View approved content {i + 1} <ArrowUpRight className="inline size-4" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
          <aside className="space-y-5">
            <section className="surface-card p-6">
              <h2 className="text-xl font-semibold">Follow the creator</h2>
              <div className="mt-5 space-y-4">
                {socials
                  .filter((s) => s.url)
                  .map(({ url, count, label, Icon }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 hover:border-primary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Visit {label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {count === null
                              ? "Count not supplied"
                              : `${count.toLocaleString()} ${label === "YouTube" ? "subscribers" : "followers"}`}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-4" />
                    </a>
                  ))}
                {profile.socials.other.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm text-primary underline"
                  >
                    Other social channel {i + 1}
                  </a>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                Audience counts are provided by the creator and reviewed at publication. They may
                change over time.
              </p>
            </section>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <BadgeCheck className="size-7 text-primary" />
              <p className="mt-4 font-semibold">A partnership built together.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Public information is shared with the creator’s consent. Partnership scope and
                services are agreed individually.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

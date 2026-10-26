"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Instagram,
  Youtube,
  Facebook,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  applicationPath,
  influencerCategories,
  mediaUrl,
  type InfluencerProfile,
} from "@/lib/influencers";

export function InfluencerCard({ profile }: { profile: InfluencerProfile }) {
  const socials = profile.socials;
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/40">
      <Link
        href={`/influencers/${profile.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
        aria-label={`View ${profile.display_name}'s profile`}
      >
        {profile.profile_image ? (
          <img
            src={mediaUrl(profile.profile_image)}
            alt={profile.display_name}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl text-primary/60">
            {profile.display_name.slice(0, 1)}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur">
          <BadgeCheck className="mr-1 inline size-3.5" /> Official Partner
        </span>
      </Link>
      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-primary">{profile.category}</p>
          <h3 className="text-xl font-semibold">{profile.display_name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {profile.city}, {profile.state}
          </p>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {profile.biography}
        </p>
        {profile.specialization && (
          <p className="text-xs text-muted-foreground">Creates: {profile.specialization}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs">
          {(
            [
              [socials.instagram, socials.instagram_followers, Instagram, "Instagram"],
              [socials.youtube, socials.youtube_followers, Youtube, "YouTube"],
              [socials.facebook, socials.facebook_followers, Facebook, "Facebook"],
            ] as const
          ).map(([url, count, Icon, label]) =>
            url ? (
              <a
                key={String(label)}
                href={String(url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${profile.display_name} on ${label}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                {typeof Icon !== "string" && <Icon className="size-4" />}
                <span className="max-w-44 truncate">
                  {label} · {new URL(url).pathname.split("/").filter(Boolean).pop() || "Profile"}
                  <br />
                  <span className="text-muted-foreground">
                    {count === null
                      ? "Count not supplied"
                      : `${count.toLocaleString()} ${label === "YouTube" ? "subscribers" : "followers"}`}
                  </span>
                </span>
              </a>
            ) : null,
          )}
        </div>
        <Link
          href={`/influencers/${profile.slug}`}
          className="flex items-center justify-between border-t border-border/60 pt-4 text-sm font-medium"
        >
          View Profile
          <ArrowUpRight className="size-4 text-primary" />
        </Link>
      </div>
    </article>
  );
}
export function InfluencerDirectory({
  profiles,
  unavailable = false,
}: {
  profiles: InfluencerProfile[];
  unavailable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const locations = [...new Set(profiles.map((p) => `${p.city}, ${p.state}`))].sort();
  const filtered = profiles.filter(
    (p) =>
      p.display_name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!category || p.category === category) &&
      (!location || `${p.city}, ${p.state}` === location) &&
      (!platform ||
        (platform === "other"
          ? p.socials.other.length > 0
          : !!p.socials[platform as "instagram" | "youtube" | "facebook"])),
  );
  const selectClass =
    "h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <div>
      <div className="mb-7 grid gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search influencers by name"
            placeholder="Find a creator…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
        <select
          aria-label="Filter by platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={selectClass}
        >
          <option value="">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="facebook">Facebook</option>
          <option value="other">Other platforms</option>
        </select>
        <select
          aria-label="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={selectClass}
        >
          <option value="">All locations</option>
          {locations.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">All categories</option>
          {influencerCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {unavailable ? (
        <div role="status" className="rounded-2xl border border-border bg-card p-10 text-center">
          <h3 className="text-xl font-semibold">The directory is temporarily unavailable.</h3>
          <p className="mt-3 text-muted-foreground">
            Please check back shortly. You can still explore the program and prepare your
            application.
          </p>
          <Button asChild className="mt-6">
            <Link href={applicationPath}>Join Our Influencer Program</Link>
          </Button>
        </div>
      ) : !profiles.length ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-16 text-center">
          <Users className="mx-auto mb-5 size-10 text-primary" />
          <h3 className="text-2xl font-semibold">A new chapter. Your story could be part of it.</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Our official directory will grow as partnerships are approved and creators choose to
            share their profiles. Ready to introduce yourself?
          </p>
          <Button asChild className="mt-6">
            <Link href={applicationPath}>
              Join Our Influencer Program <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <p role="status" aria-live="polite" className="mb-5 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "partner" : "partners"} found
          </p>
          {filtered.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((profile) => (
                <InfluencerCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p>No partners match these filters.</p>
              <Button
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  setSearch("");
                  setPlatform("");
                  setLocation("");
                  setCategory("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

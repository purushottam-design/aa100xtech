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
import { applicationPath, influencerCategories, mediaUrl } from "@/lib/influencers";
import { filterCreators, followerRanges, type CreatorListing } from "@/lib/creator-discovery";
import { creatorCategories } from "@/data/influencer-marketing";

export function InfluencerCard({
  profile,
  onCollaborate,
  showAudienceCounts = true,
}: {
  profile: CreatorListing;
  onCollaborate?: (profile: CreatorListing) => void;
  showAudienceCounts?: boolean;
}) {
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
                  {showAudienceCounts && (
                    <>
                      <br />
                      <span className="text-muted-foreground">
                        {count === null
                          ? "Count not supplied"
                          : `${count.toLocaleString()} ${label === "YouTube" ? "subscribers" : "followers"}`}
                      </span>
                    </>
                  )}
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
        {onCollaborate && (
          <Button type="button" className="w-full" onClick={() => onCollaborate(profile)}>
            Collaborate <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </article>
  );
}
export function InfluencerDirectory({
  profiles,
  unavailable = false,
  marketing = false,
  selectedCategory,
  onCategoryChange,
  onCollaborate,
  registrationHref = applicationPath,
}: {
  profiles: CreatorListing[];
  unavailable?: boolean;
  marketing?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onCollaborate?: (profile: CreatorListing) => void;
  registrationHref?: string;
}) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [followers, setFollowers] = useState("");
  const [visible, setVisible] = useState(6);
  const currentCategory = selectedCategory ?? category;
  const limit = typeof visible === "number" ? visible : 6;
  const locations = [
    ...new Set(profiles.map((profile) => `${profile.city}, ${profile.state}`)),
  ].sort();
  const filtered = filterCreators(profiles, {
    search,
    platform,
    location,
    category: currentCategory,
    followers,
  });
  const selectClass =
    "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const changeCategory = (value: string) => {
    setCategory(value);
    onCategoryChange?.(value);
    setVisible(6);
  };
  const reset = () => {
    setSearch("");
    setPlatform("");
    setLocation("");
    changeCategory("");
    setFollowers("");
    setVisible(6);
  };
  return (
    <div>
      <div
        className={`mb-7 grid gap-4 rounded-2xl border border-primary/15 bg-white p-5 shadow-sm sm:grid-cols-2 ${marketing ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        <label className="min-w-0 space-y-2 text-xs font-semibold text-foreground">
          Search
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3.5 size-4 text-muted-foreground"
            />
            <Input
              aria-label={
                marketing
                  ? "Search creators by name, niche or location"
                  : "Search influencers by name"
              }
              placeholder="Name, niche or location"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisible(6);
              }}
              className="h-11 pl-10 font-normal"
            />
          </span>
        </label>
        <label className="min-w-0 space-y-2 text-xs font-semibold">
          Platform
          <select
            aria-label="Filter by platform"
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value);
              setVisible(6);
            }}
            className={selectClass}
          >
            <option value="">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            {marketing && <option value="snapchat">Snapchat</option>}
            <option value="other">Other platforms</option>
          </select>
        </label>
        <label className="min-w-0 space-y-2 text-xs font-semibold">
          Category
          <select
            aria-label="Filter by category"
            value={currentCategory}
            onChange={(event) => changeCategory(event.target.value)}
            className={selectClass}
          >
            <option value="">All categories</option>
            {marketing
              ? creatorCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              : influencerCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {marketing && (
          <label className="min-w-0 space-y-2 text-xs font-semibold">
            Followers
            <select
              aria-label="Filter by followers"
              value={followers}
              onChange={(event) => {
                setFollowers(event.target.value);
                setVisible(6);
              }}
              className={selectClass}
            >
              <option value="">All audience sizes</option>
              {followerRanges.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="min-w-0 space-y-2 text-xs font-semibold">
          Location
          {marketing ? (
            <Input
              aria-label="Filter by location"
              placeholder="City, state or country keyword"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setVisible(6);
              }}
              className="h-11 font-normal"
            />
          ) : (
            <select
              aria-label="Filter by location"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setVisible(6);
              }}
              className={selectClass}
            >
              <option value="">All locations</option>
              {locations.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          )}
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-full">
          {marketing && (
            <p className="max-w-3xl text-xs font-normal leading-relaxed text-muted-foreground">
              Audience ranges use profile-reported counts, not independently verified metrics.
              Without a selected platform, the highest reported platform count is used. Location
              searches public profile text.
            </p>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Reset filters
          </Button>
        </div>
      </div>
      {unavailable ? (
        <div role="status" className="rounded-2xl border border-border bg-card p-10 text-center">
          <h3 className="text-xl font-semibold">The directory is temporarily unavailable.</h3>
          <p className="mt-3 text-muted-foreground">
            Please check back shortly. You can still explore the program and prepare your
            application.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={registrationHref}>Join Our Influencer Program</Link>
            </Button>
            {marketing && (
              <Button asChild variant="outline">
                <a href="/influencer-marketing#creators">Retry directory</a>
              </Button>
            )}
          </div>
        </div>
      ) : !profiles.length ? (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-6 py-14 text-center">
          <Users aria-hidden="true" className="mx-auto mb-5 size-10 text-primary" />
          <h3 className="text-2xl font-semibold">
            Your next collaboration starts with the right introduction.
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Approved, opt-in creator profiles will appear here as they become available. Share your
            campaign brief, or apply to join our creator network.
          </p>
          <Button asChild className="mt-6">
            <Link href={registrationHref}>
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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.slice(0, limit).map((profile) => (
                  <InfluencerCard
                    key={profile.id}
                    profile={profile}
                    {...(onCollaborate ? { onCollaborate } : {})}
                    showAudienceCounts={!marketing}
                  />
                ))}
              </div>
              {filtered.length > limit && (
                <div className="mt-8 text-center">
                  <Button type="button" variant="outline" onClick={() => setVisible(limit + 6)}>
                    Load more creators
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <h3 className="text-xl font-semibold">No partners match these filters.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Try another niche, location or audience range.
              </p>
              <Button type="button" variant="ghost" className="mt-3" onClick={reset}>
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Crown, Search, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { primaryPlatform, type RankedInfluencer } from "@/lib/influencer-program";

export function PartnerPortrait({
  partner,
  featured = false,
}: {
  partner: RankedInfluencer;
  featured?: boolean;
}) {
  return partner.profileImage ? (
    <img
      src={partner.profileImage}
      alt={partner.name}
      width={640}
      height={720}
      loading={featured ? "eager" : "lazy"}
      className="ip-partner-photo"
    />
  ) : (
    <div
      className="ip-partner-avatar"
      aria-label={`${partner.name}'s profile photograph is not supplied`}
    >
      {partner.name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")}
    </div>
  );
}

export function RankedPartnerCard({ partner }: { partner: RankedInfluencer }) {
  const top = partner.rank === 1;
  return (
    <article
      className={`ip-rank-card ${top ? "ip-rank-card-first" : ""}`}
      data-partner-id={partner.id}
      data-rank={partner.rank}
    >
      <Link
        href={partner.profileUrl}
        className="ip-rank-portrait"
        aria-label={`View ${partner.name}'s profile`}
      >
        <PartnerPortrait partner={partner} />
        <span className="ip-rank-number">
          {top ? <Crown aria-hidden="true" className="size-4" /> : null} #{partner.rank}
        </span>
        {top && (
          <span className="ip-rank-award">
            <Trophy className="size-3.5" /> Top Partner
          </span>
        )}
      </Link>
      <div className="ip-rank-content">
        <div className="flex items-center justify-between gap-3">
          <span className="ip-platform">{partner.platform}</span>
          <BadgeCheck className="size-4 text-primary" aria-label="Official partner" />
        </div>
        <h3 className="mt-2 text-xl font-bold">
          <Link href={partner.profileUrl}>{partner.name}</Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {partner.profile.city}, {partner.profile.state}
        </p>
        <p className="ip-conversion-count">
          <strong>{partner.convertedClients.toLocaleString("en-IN")}</strong> converted{" "}
          {partner.convertedClients === 1 ? "client" : "clients"}
        </p>
        <span
          className={`ip-level-badge ${partner.partnerLevel === "Elite Partner" ? "ip-level-elite" : ""}`}
        >
          {partner.partnerLevel}
        </span>
        <Link href={partner.profileUrl} className="ip-profile-link">
          View Profile <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function InfluencerLeaderboard({ partners }: { partners: RankedInfluencer[] }) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const locations = [
    ...new Set(partners.map((p) => `${p.profile.city}, ${p.profile.state}`)),
  ].sort();
  const categories = [...new Set(partners.map((p) => p.profile.category))].sort();
  const filtered = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.trim().toLowerCase()) &&
      (!platform || primaryPlatform(p.profile)[0] === platform) &&
      (!category || p.profile.category === category) &&
      (!location || `${p.profile.city}, ${p.profile.state}` === location),
  );
  const podium = filtered.filter((p) => p.rank <= 3);
  const remaining = filtered.filter((p) => p.rank > 3);
  const clear = () => {
    setSearch("");
    setPlatform("");
    setCategory("");
    setLocation("");
  };
  return (
    <div>
      <div className="ip-directory-filters">
        <div className="relative">
          <Search
            className="absolute left-3 top-3.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search influencers by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a partner"
            className="h-11 pl-10"
          />
        </div>
        <select
          aria-label="Filter by platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="facebook">Facebook</option>
          <option value="other">Other platforms</option>
        </select>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">All locations</option>
          {locations.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <p role="status" aria-live="polite" className="mb-6 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "partner" : "partners"} · Ranked by confirmed
        client conversions
      </p>
      {podium.length > 0 && (
        <div className="ip-podium">
          {podium.map((partner) => (
            <RankedPartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
      {remaining.length > 0 && (
        <div className="ip-partner-grid mt-7">
          {remaining.map((partner) => (
            <RankedPartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
      {!filtered.length && (
        <div className="ip-empty">
          <Users className="mx-auto size-8 text-primary" />
          <h3 className="mt-4 text-xl font-semibold">No partners match these filters.</h3>
          <Button variant="outline" className="mt-5" onClick={clear}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

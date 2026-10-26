import Link from "next/link";
import { listPublishedInfluencers } from "@/lib/influencers.server";
import { InfluencerCard } from "@/components/influencer-directory";
export async function FeaturedInfluencers() {
  const { profiles } = await listPublishedInfluencers();
  const featured = profiles.filter((p) => p.featured).slice(0, 3);
  if (!featured.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Our creator community</p>
          <h2 className="mt-3 text-3xl font-bold">Featured Influencer Partners</h2>
        </div>
        <Link href="/influencers" className="text-sm text-primary underline">
          Explore the program
        </Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <InfluencerCard key={p.id} profile={p} />
        ))}
      </div>
    </section>
  );
}

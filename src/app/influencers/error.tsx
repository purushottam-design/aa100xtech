"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function InfluencerError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">The influencer directory is temporarily unavailable.</h1>
      <p className="mt-4 text-muted-foreground">Please try again shortly.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/influencers">Back to the program</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Demo } from "@/data/demos";

function embedUrl(demo: Demo) {
  if (demo.youtubeId) return `https://www.youtube-nocookie.com/embed/${demo.youtubeId}`;
  if (demo.vimeoId) return `https://player.vimeo.com/video/${demo.vimeoId}`;
  return null;
}

function DemoCard({ demo }: { demo: Demo }) {
  const [playing, setPlaying] = useState(false);
  const iframe = embedUrl(demo);
  const hasMedia = Boolean(iframe || demo.videoUrl);

  return (
    <article className="surface-card overflow-hidden">
      <div className="relative aspect-video w-full bg-surface-2">
        {playing && iframe ? (
          <iframe
            src={`${iframe}?autoplay=1`}
            title={demo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 size-full"
          />
        ) : playing && demo.videoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={demo.videoUrl} controls autoPlay className="absolute inset-0 size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => hasMedia && setPlaying(true)}
            aria-label={hasMedia ? `Play ${demo.title}` : `${demo.title} sample coming soon`}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface-2 to-surface transition-colors hover:from-surface"
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 transition-transform group-hover:scale-110">
              <Play className="size-6" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {hasMedia ? "Play sample" : "Sample on request"}
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <Badge variant="secondary" className="w-fit">
          {demo.format}
        </Badge>
        <h3 className="mt-3 font-display text-lg font-semibold">{demo.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{demo.blurb}</p>
      </div>
    </article>
  );
}

export function ServiceDemos({ demos }: { demos: Demo[] }) {
  if (demos.length === 0) return null;

  return (
    <section className="border-b border-border/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Demo examples
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          See the output before you commit
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Real formats we deliver for this service. Ask for the full reel and we will send the
          latest client-approved cuts.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <DemoCard key={d.title} demo={d} />
          ))}
        </div>
      </div>
    </section>
  );
}

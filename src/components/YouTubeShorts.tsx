"use client";

import { useState } from "react";
import { Play, Youtube } from "lucide-react";

export type Short = { id: string; title?: string };

type YouTubeShortsProps = {
  shorts: Short[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  channelUrl?: string;
  /** Marquee duration in seconds (lower = faster). */
  speedSeconds?: number;
};

const ShortCard = ({
  short,
  cardKey,
  playingKey,
  onPlay,
}: {
  short: Short;
  cardKey: string;
  playingKey: string | null;
  onPlay: (key: string) => void;
}) => {
  const isPlaying = playingKey === cardKey;
  return (
    <div className="relative aspect-[9/16] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-border bg-black shadow-sm sm:w-[200px]">
      {isPlaying ? (
        <iframe
          src={`https://www.youtube.com/embed/${short.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={short.title || "Candidate Short"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => onPlay(cardKey)}
          className="group/card relative block h-full w-full text-left"
          aria-label={`Play ${short.title || "candidate short"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`}
            alt={short.title || "Candidate Short"}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover/card:bg-black/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#264a7f] shadow-lg">
              <Play size={22} className="ml-0.5 fill-current" />
            </span>
          </span>
          {short.title && (
            <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent px-2.5 py-2 text-xs font-medium text-white">
              {short.title}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

/**
 * Right-to-left auto-scrolling carousel of YouTube Shorts. Pauses on hover or
 * while a Short is playing. Hides itself when no Shorts are configured.
 */
export default function YouTubeShorts({
  shorts,
  eyebrow = "Candidate Shorts",
  title = "See how candidates get hired",
  subtitle = "Real stories and tips from candidates on our YouTube channel.",
  channelUrl,
  speedSeconds = 45,
}: YouTubeShortsProps) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  if (!shorts || shorts.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...shorts, ...shorts];

  return (
    <section className="overflow-hidden py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0000] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
          <Youtube size={14} /> {eyebrow}
        </span>
        <h2 className="mt-5 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
      </div>

      {/* Marquee — pauses on hover or while playing */}
      <div className="group relative mt-8 sm:mt-12">
        {/* Edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />

        <div
          className={`marquee-track flex w-max gap-3 px-4 group-hover:[animation-play-state:paused] sm:gap-4 ${
            playingKey ? "[animation-play-state:paused]" : ""
          }`}
          style={{ animation: `marquee ${speedSeconds}s linear infinite` }}
        >
          {loop.map((short, i) => {
            const cardKey = `${short.id}-${i}`;
            return (
              <ShortCard
                key={cardKey}
                short={short}
                cardKey={cardKey}
                playingKey={playingKey}
                onPlay={setPlayingKey}
              />
            );
          })}
        </div>
      </div>

      {channelUrl && (
        <div className="mt-8 text-center">
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <Youtube size={16} className="text-[#FF0000]" /> Visit our channel
          </a>
        </div>
      )}
    </section>
  );
}

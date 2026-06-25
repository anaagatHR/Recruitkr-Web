"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, X, Youtube } from "lucide-react";
import { fetchShorts } from "@/lib/videos";

export type Short = {
  id: string;
  title?: string;
  source?: "youtube" | "upload";
  url?: string;
  posterUrl?: string;
};

type YouTubeShortsProps = {
  /** Provide shorts directly… */
  shorts?: Short[];
  /** …or fetch them from the database by audience ("all" = every audience; otherwise exact). */
  audience?: "candidate" | "employer" | "both" | "all";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  channelUrl?: string;
  /** Marquee duration in seconds (lower = faster). */
  speedSeconds?: number;
};

/**
 * Minimal player for uploaded videos: only a play/pause control and a seek
 * timeline. No native settings, fullscreen, download, PiP or volume UI. Plays
 * the source file at full quality.
 */
const UploadVideoPlayer = ({
  short,
  cardKey,
  onPlay,
}: {
  short: Short;
  cardKey: string;
  onPlay: (key: string | null) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio);
  };

  return (
    <div
      className="relative aspect-[9/16] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-border bg-black shadow-sm sm:w-[200px]"
      onMouseEnter={() => {
        const v = videoRef.current;
        if (v) {
          v.muted = false;
          void v.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        videoRef.current?.pause();
      }}
    >
      <video
        ref={videoRef}
        src={short.url}
        poster={short.posterUrl || undefined}
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onPlay={() => {
          setPlaying(true);
          onPlay(cardKey);
        }}
        onPause={() => {
          setPlaying(false);
          onPlay(null);
        }}
        onEnded={() => {
          setPlaying(false);
          onPlay(null);
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v && v.duration) setProgress(v.currentTime / v.duration);
        }}
        className="h-full w-full object-cover"
      />

      {/* Play / pause — the only button */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="group/btn absolute inset-0 flex items-center justify-center"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#264a7f] shadow-lg transition-opacity ${
            playing ? "opacity-0 group-hover/btn:opacity-100" : "opacity-100"
          }`}
        >
          {playing ? <Pause size={20} className="fill-current" /> : <Play size={22} className="ml-0.5 fill-current" />}
        </span>
      </button>

      {/* Timeline (seek) — the only other control */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 cursor-pointer px-2.5 pb-2.5 pt-3"
        onClick={seek}
      >
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
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
  onPlay: (key: string | null) => void;
}) => {
  const isPlaying = playingKey === cardKey;

  // Uploaded videos use a minimal custom player (play/pause + timeline only).
  if (short.source === "upload" && short.url) {
    return <UploadVideoPlayer short={short} cardKey={cardKey} onPlay={onPlay} />;
  }

  return (
    <div
      className="relative aspect-[9/16] w-[160px] shrink-0 overflow-hidden rounded-2xl border border-border bg-black shadow-sm sm:w-[200px]"
      onMouseEnter={() => onPlay(cardKey)}
      onMouseLeave={() => onPlay(null)}
    >
      {isPlaying ? (
        <>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${short.id}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&playsinline=1`}
            title={short.title || "Short"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            // controls=0 removes volume/settings/CC/fullscreen; the scale crops
            // off YouTube's top channel/title bar (no param can hide it).
            className="pointer-events-none h-full w-full scale-[1.2]"
          />
          {/* Stop button (esp. for phones, where there's no mouse-leave). */}
          <button
            type="button"
            onClick={() => onPlay(null)}
            aria-label="Stop video"
            className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
          >
            <X size={15} />
          </button>
        </>
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
  audience,
  eyebrow = "Candidate Shorts",
  title = "See how candidates get hired",
  subtitle = "Real stories and tips from candidates on our YouTube channel.",
  channelUrl,
  speedSeconds = 45,
}: YouTubeShortsProps) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [remote, setRemote] = useState<Short[] | null>(audience ? null : shorts ?? []);

  useEffect(() => {
    if (!audience) return;
    let cancelled = false;
    fetchShorts(audience)
      .then((data) => {
        if (!cancelled) setRemote(data);
      })
      .catch(() => {
        if (!cancelled) setRemote([]);
      });
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const items = audience ? remote : shorts ?? [];

  // Hide while loading from the DB, and when there are no Shorts.
  if (items === null || items.length === 0) return null;

  // Duplicate the list so the marquee loops seamlessly.
  const loop = [...items, ...items];

  // Stop the scroll on hover, while touched (phones), or while a video plays.
  const paused = hovered || playingKey !== null;

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

      {/* Marquee — pauses on hover, touch (phones), or while playing */}
      <div
        className="group relative mt-8 sm:mt-12"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
      >
        {/* Edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />

        <div
          className="marquee-track flex w-max gap-3 px-4 sm:gap-4"
          style={{
            animation: `marquee ${speedSeconds}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
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

"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { fetchShowcaseVideos, type ShowcaseVideo } from "@/lib/videos";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const VideoCard = ({ video }: { video: ShowcaseVideo }) => (
  <figure className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative aspect-[3/4] w-full bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={video.url}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    </div>
    <figcaption className="flex items-center gap-3 p-3">
      {video.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.photoUrl} alt={video.candidateName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#264a7f_0%,#69a44f_100%)] text-xs font-bold text-white">
          {initialsOf(video.candidateName)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-foreground">{video.candidateName}</span>
        <span className="block truncate text-xs text-muted-foreground">{video.role}</span>
      </span>
    </figcaption>
  </figure>
);

export default function VideoShowcase() {
  const [videos, setVideos] = useState<ShowcaseVideo[] | null>(null);

  useEffect(() => {
    fetchShowcaseVideos(12)
      .then(setVideos)
      .catch(() => setVideos([]));
  }, []);

  // Hide the whole section when there are no real videos — never show fakes.
  if (videos !== null && videos.length === 0) return null;

  return (
    <section className="bg-[linear-gradient(180deg,#f6f9ff_0%,#ffffff_100%)] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#264a7f] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
            <Video size={13} /> Candidate intros
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-[hsl(var(--navy-deep))] sm:text-4xl">
            Meet candidates <span className="text-gradient-teal">on video</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Candidates record a short intro so employers see who they are before the interview — not just a resume.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {videos === null
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[3/4] w-full animate-pulse bg-slate-200" />
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))
            : videos.map((video) => <VideoCard key={video.id} video={video} />)}
        </div>
      </div>
    </section>
  );
}

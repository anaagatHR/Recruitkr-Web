"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, Video } from "lucide-react";
import {
  CandidateVideoItem,
  MAX_VIDEO_BYTES,
  deleteMyVideo,
  fetchMyVideos,
  uploadMyVideo,
} from "@/lib/videos";

const MAX_VIDEOS = 5;

/**
 * Candidate video manager: upload, preview, and delete intro/portfolio videos.
 * These are shown to employers inside the chat details panel. Self-contained so
 * it can be dropped into the dashboard without touching its other state.
 */
const CandidateVideos = () => {
  const [videos, setVideos] = useState<CandidateVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void fetchMyVideos()
      .then((list) => active && setVideos(list))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError("");
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file (MP4, WEBM, MOV, or MKV).");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Videos must be 50MB or smaller.");
      return;
    }
    if (videos.length >= MAX_VIDEOS) {
      setError(`You can upload up to ${MAX_VIDEOS} videos. Delete one to add another.`);
      return;
    }

    setUploading(true);
    try {
      const created = await uploadMyVideo(file);
      setVideos((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setError("");
    try {
      await deleteMyVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the video.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Video className="text-primary" size={18} />
          <h3 className="text-base font-bold text-foreground">Intro videos</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {videos.length}/{MAX_VIDEOS}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload short intro or portfolio videos. Employers can watch them in the chat.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || videos.length >= MAX_VIDEOS}
        className="btn-gradient mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Uploading…
          </>
        ) : (
          <>
            <Upload size={16} /> Upload video
          </>
        )}
      </button>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : videos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No videos yet. Upload one to stand out to employers.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((video) => (
              <div key={video.id} className="overflow-hidden rounded-xl border border-border">
                <video src={video.url} controls preload="metadata" className="w-full bg-black" />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs text-muted-foreground">{video.name}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    aria-label="Delete video"
                  >
                    {deletingId === video.id ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CandidateVideos;

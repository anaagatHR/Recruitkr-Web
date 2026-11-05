import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, upload, type MediaFile } from "../api";
import { driveEnabled, pickFromDrive } from "../drive";
import { useToast } from "../ui";

type Stored = { url: string; type: string; name: string };
const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm";

/** Upload a local file (with progress) to the site's media folder. */
export function useUpload() {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const run = async (file: Blob, name: string) => {
    setProgress(0);
    try {
      const stored = await upload<Stored>("/studio/media", file, name, setProgress);
      qc.invalidateQueries({ queryKey: ["media"] });
      return stored;
    } finally {
      setProgress(null);
    }
  };
  return { run, progress };
}

export async function importDrive(kind: "image" | "video" | "any"): Promise<Stored | null> {
  const picked = await pickFromDrive(kind);
  if (!picked) return null;
  return api<Stored>("/studio/media/from-drive", { method: "POST", body: picked });
}

/** The media grid. With `onPick` it is a chooser; without, the Media panel. */
export function MediaLibrary({ onPick, kind = "any" }: { onPick?: (url: string) => void; kind?: "image" | "video" | "any" }) {
  const toast = useToast();
  const qc = useQueryClient();
  const media = useQuery({ queryKey: ["media"], queryFn: () => api<MediaFile[]>("/studio/media") });
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const { run, progress } = useUpload();

  const done = (stored: Stored | null) => {
    if (!stored) return;
    toast.ok(`Added ${stored.name}`);
    onPick?.(stored.url);
  };
  const uploadFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      try {
        done(await run(file, file.name));
      } catch (err) {
        toast.error(err);
      }
    }
  };

  const files = (media.data ?? []).filter(
    (f) => (kind === "any" || f.kind === kind) && f.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search files" />
        <label className="btn-primary cursor-pointer">
          Upload
          <input type="file" className="sr-only" accept={ACCEPT} multiple onChange={(e) => uploadFiles(e.target.files)} />
        </label>
        {driveEnabled ? (
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                done(await importDrive(kind));
                qc.invalidateQueries({ queryKey: ["media"] });
              } catch (err) {
                toast.error(err);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Copying from Drive…" : "From Google Drive"}
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={`mb-3 rounded-lg border-2 border-dashed p-4 text-center text-sm ${dragging ? "border-violet-400 bg-violet-500/10" : "border-white/10 text-slate-400"}`}
      >
        {progress !== null ? (
          <div>
            <p className="mb-2 text-slate-200">Uploading… {progress}%</p>
            <div className="h-2 overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          "Drop images (JPG, PNG, WEBP, SVG up to 5MB) or videos (MP4, WEBM up to 50MB) here"
        )}
      </div>

      {media.isLoading ? <p className="text-sm text-slate-400">Loading media…</p> : null}
      {media.isError ? <p className="text-sm text-rose-300">Could not load the media library.</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {files.map((f) => (
          <li key={f.fileId}>
            <button
              type="button"
              disabled={!onPick}
              onClick={() => onPick?.(f.url)}
              className="group block w-full overflow-hidden rounded-lg border border-white/10 bg-slate-800 text-left enabled:hover:border-violet-400"
            >
              <div className="flex aspect-square items-center justify-center bg-slate-950">
                {f.kind === "image" ? (
                  <img src={f.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <video src={f.url} className="h-full w-full object-cover" muted preload="metadata" />
                )}
              </div>
              <p className="truncate px-2 py-1 text-[11px] text-slate-400">
                {f.folder === "team" ? "Team · " : ""}
                {f.name}
              </p>
            </button>
          </li>
        ))}
      </ul>
      {!media.isLoading && !files.length ? <p className="text-sm text-slate-500">No files yet.</p> : null}
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api, type Member } from "../api";
import { driveEnabled } from "../drive";
import { Modal, useToast } from "../ui";
import { importDrive, MediaLibrary, useUpload } from "./MediaLibrary";

const EMPTY: Omit<Member, "id" | "displayOrder" | "active"> = { name: "", role: "", summary: "", image: "", video: "", linkedin: "", email: "" };

/** Team cards: drag to reorder, click to edit, hide/show. Nobody is ever deleted (the CRM may point at them). */
export function TeamPanel({ onChanged }: { onChanged: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const team = useQuery({ queryKey: ["team"], queryFn: () => api<Member[]>("/studio/team") });
  const [order, setOrder] = useState<Member[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | "new" | null>(null);

  useEffect(() => setOrder(team.data ?? []), [team.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["team"] });
    onChanged();
  };

  const saveOrder = async (next: Member[]) => {
    setOrder(next);
    try {
      await api("/studio/team/reorder", { method: "PUT", body: { ids: next.map((m) => m.id) } });
      toast.ok("Order saved. It is live on the site now.");
      refresh();
    } catch (err) {
      toast.error(err);
      setOrder(team.data ?? []);
    }
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...order];
    const from = next.findIndex((m) => m.id === dragId);
    const to = next.findIndex((m) => m.id === targetId);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    saveOrder(next);
  };

  const toggle = async (m: Member) => {
    try {
      await api(`/studio/team/${m.id}/active`, { method: "PATCH", body: { active: !m.active } });
      toast.ok(m.active ? `${m.name} is hidden from the site` : `${m.name} is shown on the site`);
      refresh();
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-400">Drag cards to reorder. Team changes go live at once (no publish step).</p>
        <button type="button" className="btn-primary" onClick={() => setEditing("new")}>
          + Add member
        </button>
      </div>
      {team.isLoading ? <p className="text-sm text-slate-400">Loading team…</p> : null}
      {team.isError ? <p className="text-sm text-rose-300">Could not load the team.</p> : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {order.map((m) => (
          <li
            key={m.id}
            draggable
            onDragStart={() => setDragId(m.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropOn(m.id)}
            className={`card flex cursor-grab items-center gap-3 p-3 active:cursor-grabbing ${dragId === m.id ? "opacity-50" : ""} ${m.active ? "" : "opacity-60"}`}
          >
            <span aria-hidden className="select-none text-slate-500">⠿</span>
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-800">
              {m.image ? <img src={m.image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{m.name || "(no name)"}</p>
              <p className="truncate text-xs text-slate-400">{m.role}</p>
              {!m.active ? <p className="text-[11px] text-amber-300">Hidden</p> : null}
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" className="btn-ghost min-h-[28px] px-2 text-xs" onClick={() => setEditing(m)}>
                Edit
              </button>
              <button type="button" className="btn-ghost min-h-[28px] px-2 text-xs" onClick={() => toggle(m)}>
                {m.active ? "Hide" : "Show"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {editing ? (
        <MemberDialog
          member={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function MemberDialog({ member, onClose, onSaved }: { member: Member | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...(member ?? {}) });
  const [saving, setSaving] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [library, setLibrary] = useState<"image" | "video" | null>(null);
  const { run, progress } = useUpload();
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: form.name, role: form.role, summary: form.summary, image: form.image, video: form.video, linkedin: form.linkedin, email: form.email };
      if (member) await api(`/studio/team/${member.id}`, { method: "PUT", body });
      else await api("/studio/team", { method: "POST", body });
      toast.ok(member ? "Saved. It is live on the site now." : "Member added to the site.");
      onSaved();
    } catch (err) {
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const uploadVideo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const stored = await run(file, file.name);
      setForm((f) => ({ ...f, video: stored.url }));
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <Modal title={member ? `Edit ${member.name}` : "Add a team member"} onClose={onClose} wide>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="m-name">Name *</label>
            <input id="m-name" className="input" maxLength={80} value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label className="label" htmlFor="m-role">Role</label>
            <input id="m-role" className="input" maxLength={80} value={form.role} onChange={set("role")} />
          </div>
          <div>
            <label className="label" htmlFor="m-summary">Summary</label>
            <textarea id="m-summary" className="input" rows={4} maxLength={600} value={form.summary} onChange={set("summary")} />
          </div>
          <div>
            <label className="label" htmlFor="m-linkedin">LinkedIn URL</label>
            <input id="m-linkedin" className="input" placeholder="https://www.linkedin.com/in/…" value={form.linkedin} onChange={set("linkedin")} />
          </div>
          <div>
            <label className="label" htmlFor="m-email">Email</label>
            <input id="m-email" className="input" type="email" value={form.email} onChange={set("email")} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="label">Photo (cropped to a square)</p>
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-800">
                {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex flex-col gap-2">
                <label className="btn-ghost cursor-pointer">
                  Upload photo…
                  <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCropFile(e.target.files?.[0] ?? null)} />
                </label>
                <button type="button" className="btn-ghost" onClick={() => setLibrary("image")}>
                  From media library
                </button>
              </div>
            </div>
          </div>
          <div>
            <p className="label">Intro video</p>
            {form.video ? <video src={form.video} controls className="mb-2 aspect-video w-full rounded-lg bg-black" /> : null}
            <div className="flex flex-wrap gap-2">
              <label className="btn-ghost cursor-pointer">
                Upload video…
                <input type="file" className="sr-only" accept="video/mp4,video/webm" onChange={(e) => uploadVideo(e.target.files?.[0])} />
              </label>
              {driveEnabled ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={async () => {
                    try {
                      const stored = await importDrive("video");
                      if (stored) setForm((f) => ({ ...f, video: stored.url }));
                    } catch (err) {
                      toast.error(err);
                    }
                  }}
                >
                  From Google Drive
                </button>
              ) : null}
              <button type="button" className="btn-ghost" onClick={() => setLibrary("video")}>
                From media library
              </button>
              {form.video ? (
                <button type="button" className="btn-ghost text-rose-300" onClick={() => setForm((f) => ({ ...f, video: "" }))}>
                  Remove video
                </button>
              ) : null}
            </div>
            {progress !== null ? <p className="mt-2 text-xs text-slate-300">Uploading… {progress}%</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={saving || !form.name.trim()} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {cropFile ? (
        <CropDialog
          file={cropFile}
          onClose={() => setCropFile(null)}
          onDone={async (blob) => {
            setCropFile(null);
            try {
              const stored = await run(blob, `${form.name || "member"}.jpg`);
              setForm((f) => ({ ...f, image: stored.url }));
            } catch (err) {
              toast.error(err);
            }
          }}
        />
      ) : null}
      {library ? (
        <Modal title="Media library" onClose={() => setLibrary(null)} wide>
          <MediaLibrary
            kind={library}
            onPick={(url) => {
              setForm((f) => ({ ...f, [library]: url }));
              setLibrary(null);
            }}
          />
        </Modal>
      ) : null}
    </Modal>
  );
}

/** Square crop with zoom and drag-to-position, exported as an 800px JPEG. */
function CropDialog({ file, onClose, onDone }: { file: File; onClose: () => void; onDone: (blob: Blob) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = (c: HTMLCanvasElement, size: number) => {
    if (!img) return;
    const ctx = c.getContext("2d")!;
    const side = Math.min(img.width, img.height) / zoom;
    const sx = Math.min(Math.max(pos.x * img.width - side / 2, 0), img.width - side);
    const sy = Math.min(Math.max(pos.y * img.height - side / 2, 0), img.height - side);
    c.width = size;
    c.height = size;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  };

  useEffect(() => {
    if (canvas.current) draw(canvas.current, 320);
  });

  return (
    <Modal title="Crop photo" onClose={onClose}>
      <canvas
        ref={canvas}
        className="mx-auto block aspect-square w-full max-w-[320px] cursor-move rounded-lg bg-slate-800"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !img) return;
          const scale = Math.min(img.width, img.height) / zoom / 320;
          const dx = ((drag.current.x - e.clientX) * scale) / img.width;
          const dy = ((drag.current.y - e.clientY) * scale) / img.height;
          drag.current = { x: e.clientX, y: e.clientY };
          setPos((p) => ({ x: Math.min(Math.max(p.x + dx, 0), 1), y: Math.min(Math.max(p.y + dy, 0), 1) }));
        }}
        onPointerUp={() => (drag.current = null)}
      />
      <label className="label mt-4" htmlFor="crop-zoom">Zoom</label>
      <input id="crop-zoom" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-violet-500" />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!img}
          onClick={() => {
            const out = document.createElement("canvas");
            draw(out, 800);
            out.toBlob((b) => b && onDone(b), "image/jpeg", 0.88);
          }}
        >
          Use this crop
        </button>
      </div>
    </Modal>
  );
}

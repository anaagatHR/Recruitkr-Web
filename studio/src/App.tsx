import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api, ApiFail, getSession, loginWithPin, logout, SITE_URL, type ContentList, type Revision, type Value } from "./api";
import { FieldEditor } from "./components/FieldEditor";
import { MediaLibrary } from "./components/MediaLibrary";
import { TeamPanel } from "./components/TeamPanel";
import { changedFields, contrastRatio, keyForEditId, valueText } from "./lib";
import { Modal, useToast } from "./ui";

const SITE_ORIGIN = new URL(SITE_URL).origin;
const PANELS = [
  { id: "pages", label: "Pages" },
  { id: "theme", label: "Theme" },
  { id: "brand", label: "Brand" },
  { id: "team", label: "Team" },
  { id: "media", label: "Media" },
  { id: "history", label: "History" },
] as const;
type Panel = (typeof PANELS)[number]["id"];
const DEVICES = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;
const PAGES = ["/", "/about", "/contact", "/employers", "/candidates", "/our-team", "/services"];
// What the site uses when no theme is published (src/index.css), so pickers start from the real colours.
const THEME_FALLBACK: Value = { primary: "#264a7f", secondary: "#69a44f", background: "#ffffff", foreground: "#1b2a3e", fontBody: "Inter", fontDisplay: "Sora", radius: 0.85 };

export default function App() {
  return getSession() ? <Studio /> : <Login />;
}

function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginWithPin(pin);
      window.location.reload();
    } catch (err) {
      setPin("");
      setError(
        err instanceof ApiFail && err.status === 401
          ? "Wrong PIN."
          : err instanceof TypeError
            ? "Can't reach the website API. Check your connection, or ask the developer to allow this Studio on the API."
            : err instanceof Error
              ? err.message
              : "Sign-in failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div>
          <h1 className="text-lg font-semibold text-white">RecruitKr Site Studio</h1>
          <p className="mt-1 text-sm text-slate-400">Enter the Studio PIN.</p>
        </div>
        <div>
          <label className="label" htmlFor="pin">PIN</label>
          <input
            id="pin"
            className="input text-center font-mono text-lg tracking-[0.4em]"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            required
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy || pin.length < 6}>
          {busy ? "Checking…" : "Open Studio"}
        </button>
      </form>
    </main>
  );
}

function Studio() {
  const toast = useToast();
  const qc = useQueryClient();
  const content = useQuery({ queryKey: ["content"], queryFn: () => api<ContentList>("/site-content") });
  const preview = useQuery({
    queryKey: ["preview-token"],
    queryFn: () => api<{ token: string }>("/site-content/preview-token", { method: "POST" }),
    refetchInterval: 90 * 60 * 1000,
    retry: false,
  });

  const [panel, setPanel] = useState<Panel>("pages");
  const [selectedKey, setSelectedKey] = useState("home.hero");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [path, setPath] = useState("/");
  const [edits, setEdits] = useState<Record<string, Value>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [siteDefaults, setSiteDefaults] = useState<Record<string, Value>>({});
  const [publishing, setPublishing] = useState(false);
  const [mediaPick, setMediaPick] = useState<{ kind: "image" | "video"; resolve: (url: string | null) => void } | null>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const timers = useRef<Record<string, number>>({});
  const [pending, setPending] = useState(0);

  const schema = content.data?.schema ?? {};
  const items = content.data?.items ?? {};
  const valueOf = useCallback((key: string): Value => edits[key] ?? items[key]?.draft ?? items[key]?.published ?? {}, [edits, items]);

  const post = useCallback((msg: Record<string, unknown>) => iframe.current?.contentWindow?.postMessage(msg, SITE_ORIGIN), []);

  // Messages from the preview frame: what was clicked, the site's own defaults, errors.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== SITE_ORIGIN || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "rk:select" && typeof e.data.id === "string") {
        const hit = keyForEditId(schema, e.data.id);
        if (!hit) return;
        const group = schema[hit.key].group;
        setPanel(group === "Theme" ? "theme" : group === "Brand" ? "brand" : "pages");
        setSelectedKey(hit.key);
        setHighlight(hit.field ? `${hit.key}:${hit.field}` : null);
        if (hit.field) setTimeout(() => document.getElementById(`field-${hit.key}.${hit.field}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      } else if (e.data.type === "rk:defaults" && typeof e.data.key === "string") {
        setSiteDefaults((d) => ({ ...d, [e.data.key]: e.data.value as Value }));
      } else if (e.data.type === "rk:error") {
        toast.error(String(e.data.message));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [schema, toast]);

  // Unsaved-changes guard.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (pending > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [pending]);

  const saveDraft = useCallback(
    async (key: string, value: Value) => {
      try {
        const saved = await api<{ draft: Value }>(`/site-content/${encodeURIComponent(key)}`, { method: "PUT", body: { value } });
        setErrors((e) => ({ ...e, [key]: [] }));
        qc.setQueryData<ContentList>(["content"], (old) =>
          old
            ? {
                ...old,
                items: {
                  ...old.items,
                  [key]: {
                    ...(old.items[key] ?? { published: null, version: 0 }),
                    draft: saved.draft,
                    hasChanges: JSON.stringify(saved.draft) !== JSON.stringify(old.items[key]?.published ?? null),
                  },
                },
              }
            : old,
        );
        setEdits((e) => {
          if (e[key] !== value) return e; // a newer edit is waiting for its own save
          const { [key]: _, ...rest } = e;
          return rest;
        });
      } catch (err) {
        setErrors((e) => ({ ...e, [key]: err instanceof ApiFail && err.details.length ? err.details : [err instanceof Error ? err.message : String(err)] }));
      }
    },
    [qc],
  );

  /** Replace a section's value: the preview updates at once, the draft autosaves a moment later. */
  const setValue = (key: string, next: Value) => {
    setEdits((e) => ({ ...e, [key]: next }));
    post({ type: "rk:patch", key, value: next });
    if (timers.current[key]) window.clearTimeout(timers.current[key]);
    else setPending((p) => p + 1);
    timers.current[key] = window.setTimeout(async () => {
      await saveDraft(key, next);
      delete timers.current[key];
      setPending((p) => p - 1);
    }, 900);
  };

  const setField = (key: string, field: string, v: unknown) => {
    const next: Value = { ...valueOf(key) };
    if (v === undefined) delete next[field];
    else next[field] = v;
    setValue(key, next);
  };

  const pickMedia = (kind: "image" | "video") => new Promise<string | null>((resolve) => setMediaPick({ kind, resolve }));

  const changed = Object.entries(items).filter(([, it]) => it.hasChanges).map(([key]) => key);
  const iframeSrc = preview.data ? `${SITE_URL}${path}?studio=${encodeURIComponent(preview.data.token)}` : `${SITE_URL}${path}`;

  const editorFor = (key: string, fallback?: Value) => {
    const spec = schema[key];
    if (!spec) return null;
    const value = valueOf(key);
    const defaults = fallback ?? siteDefaults[key] ?? {};
    return (
      <div className="space-y-1">
        {Object.entries(spec.fields).map(([field, fs]) => (
          <FieldEditor
            key={field}
            name={`${key}.${field}`}
            spec={fs}
            value={value[field]}
            fallback={defaults[field]}
            onChange={(v) => setField(key, field, v)}
            pickMedia={pickMedia}
            highlight={highlight === `${key}:${field}`}
          />
        ))}
        {errors[key]?.length ? (
          <div role="alert" className="rounded-lg bg-rose-500/15 p-3 text-xs text-rose-200">
            <p className="font-medium">Not saved yet: fix these first</p>
            <ul className="mt-1 list-disc pl-4">
              {errors[key].map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  };

  const theme = { ...THEME_FALLBACK, ...valueOf("theme") };
  const contrast = [
    ["Button text on primary", contrastRatio("#ffffff", String(theme.primary))],
    ["Button text on secondary", contrastRatio("#ffffff", String(theme.secondary))],
    ["Body text on background", contrastRatio(String(theme.foreground), String(theme.background))],
  ] as const;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2">
        <h1 className="text-sm font-semibold text-white">Site Studio</h1>
        <span className="text-xs text-slate-500">{getSession()?.email || "Signed in with PIN"}</span>
        <span className="ml-auto text-xs text-slate-400" aria-live="polite">
          {pending > 0 ? "Saving draft…" : "Drafts saved"}
        </span>
        <button type="button" className="btn-primary" onClick={() => setPublishing(true)} disabled={pending > 0}>
          Publish{changed.length ? ` (${changed.length})` : ""}
        </button>
        <button type="button" className="btn-ghost" onClick={logout}>
          Sign out
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav aria-label="Studio" className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-2 lg:w-40 lg:flex-col lg:border-b-0 lg:border-r">
          {PANELS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-current={panel === p.id ? "page" : undefined}
              onClick={() => setPanel(p.id)}
              className={`btn justify-start ${panel === p.id ? "bg-violet-600/30 text-white" : "text-slate-300 hover:bg-white/5"}`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <section className="flex min-h-[360px] min-w-0 flex-1 flex-col bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
            <label className="sr-only" htmlFor="page">Page</label>
            <input id="page" list="pages" className="input w-48 py-1" value={path} onChange={(e) => setPath(e.target.value.startsWith("/") ? e.target.value : `/${e.target.value}`)} />
            <datalist id="pages">
              {PAGES.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div className="flex gap-1" role="group" aria-label="Preview size">
              {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((d) => (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`btn min-h-[30px] capitalize ${device === d ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/5"}`}>
                  {d}
                </button>
              ))}
            </div>
            <button type="button" className="btn-ghost min-h-[30px]" onClick={() => iframe.current?.contentWindow?.location.replace(iframeSrc)}>
              Reload
            </button>
            {preview.isError ? (
              <span className="text-xs text-amber-300">Live preview is off (STUDIO_PREVIEW_SECRET not set). Showing the published site.</span>
            ) : (
              <span className="text-xs text-slate-500">Click outlined text in the preview to edit it.</span>
            )}
          </div>
          <div className="flex min-h-0 flex-1 justify-center overflow-auto p-3">
            <iframe
              ref={iframe}
              key={iframeSrc}
              title="Website preview"
              src={iframeSrc}
              style={{ width: DEVICES[device] }}
              className="h-full min-h-[600px] max-w-full rounded-lg border border-white/10 bg-white"
            />
          </div>
        </section>

        <aside aria-label="Inspector" className="w-full shrink-0 overflow-y-auto border-t border-white/10 p-4 lg:w-[400px] lg:border-l lg:border-t-0">
          {content.isLoading ? <p className="text-sm text-slate-400">Loading…</p> : null}
          {content.isError ? <p className="text-sm text-rose-300">Could not load content. Is the API reachable?</p> : null}

          {panel === "pages" && content.data ? (
            <>
              <label className="label" htmlFor="section">Section</label>
              <select id="section" className="input mb-3" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                {Object.entries(schema)
                  .filter(([, s]) => s.group === "Pages")
                  .map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                      {items[key]?.hasChanges ? " •" : ""}
                    </option>
                  ))}
              </select>
              {editorFor(selectedKey)}
            </>
          ) : null}

          {panel === "theme" && content.data ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Theme</h2>
                <button type="button" className="btn-ghost" onClick={() => setValue("theme", {})}>
                  Reset all to default
                </button>
              </div>
              <ul className="mb-3 space-y-1 text-xs">
                {contrast.map(([label, ratio]) => (
                  <li key={label} className={ratio !== null && ratio < 4.5 ? "text-amber-300" : "text-slate-400"}>
                    {label}: {ratio ?? "–"}:1 {ratio !== null && ratio < 4.5 ? "— below WCAG AA (4.5:1), hard to read" : "✓"}
                  </li>
                ))}
              </ul>
              {editorFor("theme", THEME_FALLBACK)}
              <p className="mt-3 text-xs text-slate-500">
                Colours change the site&apos;s theme tokens (buttons, links, cards, focus rings). Some hand-coloured accents keep their own colours.
              </p>
            </>
          ) : null}

          {panel === "brand" && content.data ? editorFor("brand") : null}
          {panel === "team" ? <TeamPanel onChanged={() => post({ type: "rk:reload" })} /> : null}
          {panel === "media" ? <MediaLibrary /> : null}
          {panel === "history" && content.data ? <History schema={schema} onRestored={() => post({ type: "rk:reload" })} /> : null}
        </aside>
      </div>

      {publishing && content.data ? (
        <PublishDialog
          data={content.data}
          onClose={() => setPublishing(false)}
          onDone={() => {
            setPublishing(false);
            setEdits({});
            post({ type: "rk:reload" });
          }}
        />
      ) : null}

      {mediaPick ? (
        <Modal
          title={`Choose ${mediaPick.kind === "image" ? "an image" : "a video"}`}
          wide
          onClose={() => {
            mediaPick.resolve(null);
            setMediaPick(null);
          }}
        >
          <MediaLibrary
            kind={mediaPick.kind}
            onPick={(url) => {
              mediaPick.resolve(url);
              setMediaPick(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function PublishDialog({ data, onClose, onDone }: { data: ContentList; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const changed = Object.entries(data.items).filter(([, it]) => it.hasChanges);
  const done = (msg: string, revalidated?: boolean) => {
    toast.ok(revalidated === false ? `${msg} It shows on the site within 5 minutes.` : msg);
    qc.invalidateQueries({ queryKey: ["content"] });
  };
  const publishAll = useMutation({
    mutationFn: () => api<{ published: unknown[]; revalidated: boolean }>("/site-content/publish-all", { method: "POST" }),
    onSuccess: (r) => {
      done(`Published ${r.published.length} section${r.published.length === 1 ? "" : "s"}.`, r.revalidated);
      onDone();
    },
    onError: (err) => toast.error(err),
  });
  const one = async (key: string, action: "publish" | "discard") => {
    try {
      const r = await api<{ revalidated?: boolean }>(`/site-content/${encodeURIComponent(key)}/${action}`, { method: "POST" });
      done(action === "publish" ? `Published ${data.schema[key]?.label}.` : `Draft of ${data.schema[key]?.label} discarded.`, r.revalidated);
      if (changed.length === 1) onDone();
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <Modal title="Publish to recruitkr.com" onClose={onClose} wide>
      {!changed.length ? <p className="text-sm text-slate-400">Nothing to publish: every draft matches the live site.</p> : null}
      <div className="space-y-4">
        {changed.map(([key, it]) => (
          <div key={key} className="rounded-lg border border-white/10 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{data.schema[key]?.label ?? key}</h3>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => one(key, "discard")}>
                  Discard draft
                </button>
                <button type="button" className="btn-primary" onClick={() => one(key, "publish")}>
                  Publish this
                </button>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-2 font-medium">Field</th>
                  <th className="py-1 pr-2 font-medium">Live now</th>
                  <th className="py-1 font-medium">After publish</th>
                </tr>
              </thead>
              <tbody>
                {changedFields(it.draft, it.published).map((f) => (
                  <tr key={f} className="border-t border-white/5 align-top">
                    <td className="py-1 pr-2 text-slate-300">{data.schema[key]?.fields[f]?.label ?? f}</td>
                    <td className="py-1 pr-2 text-rose-200/80 line-through decoration-rose-400/40">{valueText(it.published?.[f])}</td>
                    <td className="py-1 text-emerald-200">{valueText(it.draft?.[f])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {changed.length > 1 ? (
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" disabled={publishAll.isPending} onClick={() => publishAll.mutate()}>
            {publishAll.isPending ? "Publishing…" : `Publish all ${changed.length}`}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

function History({ schema, onRestored }: { schema: ContentList["schema"]; onRestored: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const keys = useMemo(() => Object.keys(schema), [schema]);
  const [key, setKey] = useState(keys[0] ?? "");
  const [confirming, setConfirming] = useState<string | null>(null);
  const revisions = useQuery({
    queryKey: ["revisions", key],
    queryFn: () => api<Revision[]>(`/site-content/${encodeURIComponent(key)}/revisions`),
    enabled: Boolean(key),
  });
  const restore = async (r: Revision) => {
    try {
      const res = await api<{ revalidated: boolean }>(`/site-content/${encodeURIComponent(key)}/rollback/${r._id}`, { method: "POST" });
      toast.ok(`Version ${r.version} is live again.${res.revalidated ? "" : " It shows within 5 minutes."}`);
      setConfirming(null);
      qc.invalidateQueries({ queryKey: ["revisions", key] });
      qc.invalidateQueries({ queryKey: ["content"] });
      onRestored();
    } catch (err) {
      toast.error(err);
    }
  };
  return (
    <div>
      <label className="label" htmlFor="h-key">Section</label>
      <select id="h-key" className="input mb-3" value={key} onChange={(e) => setKey(e.target.value)}>
        {keys.map((k) => (
          <option key={k} value={k}>
            {schema[k].label}
          </option>
        ))}
      </select>
      {revisions.isLoading ? <p className="text-sm text-slate-400">Loading…</p> : null}
      {revisions.data && !revisions.data.length ? <p className="text-sm text-slate-500">Never published. The site shows its built-in content.</p> : null}
      <ol className="space-y-2">
        {revisions.data?.map((r, i) => (
          <li key={r._id} className="rounded-lg border border-white/10 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">
                  Version {r.version} {i === 0 ? <span className="text-xs text-emerald-300">(live)</span> : null}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleString()} · {r.publishedBy || "unknown"}
                  {r.note ? ` · ${r.note}` : ""}
                </p>
              </div>
              {i > 0 ? (
                confirming === r._id ? (
                  <div className="flex gap-1">
                    <button type="button" className="btn-ghost min-h-[30px]" onClick={() => setConfirming(null)}>
                      Cancel
                    </button>
                    <button type="button" className="btn-danger min-h-[30px]" onClick={() => restore(r)}>
                      Make live
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn-ghost min-h-[30px]" onClick={() => setConfirming(r._id)}>
                    Restore
                  </button>
                )
              ) : null}
            </div>
            <details className="mt-2 text-xs text-slate-400">
              <summary className="cursor-pointer">What was in it</summary>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(r.value).map(([f, v]) => (
                  <li key={f}>
                    <span className="text-slate-300">{schema[key]?.fields[f]?.label ?? f}:</span> {valueText(v)}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

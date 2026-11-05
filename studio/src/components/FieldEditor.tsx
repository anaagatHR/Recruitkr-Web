import type { ReactNode } from "react";
import type { FieldSpec, Value } from "../api";

export type PickMedia = (kind: "image" | "video") => Promise<string | null>;

type Props = {
  name: string;
  spec: FieldSpec;
  value: unknown;
  fallback?: unknown; // what the site shows when this is unset
  onChange: (v: unknown) => void;
  pickMedia: PickMedia;
  highlight?: boolean;
  changed?: boolean; // differs from what is live
  onUndo?: () => void; // back to the live value
};

const isEmpty = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** One editable field, shaped by its registry type. Empty = the site's built-in default. */
export function FieldEditor({ name, spec, value, fallback, onChange, pickMedia, highlight, changed, onUndo }: Props) {
  const id = `f-${name}`;
  const hint = !isEmpty(fallback) && typeof fallback !== "object" ? String(fallback) : "";
  const wrap = (control: ReactNode, extra?: ReactNode) => (
    <div
      id={`field-${name}`}
      className={`rounded-lg p-2 transition-colors ${highlight ? "bg-violet-500/15 ring-1 ring-violet-400" : changed ? "bg-amber-500/5 ring-1 ring-amber-400/30" : ""}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="label">
          {spec.label}
          {changed ? <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">changed</span> : null}
        </label>
        <span className="flex gap-3">
          {changed && onUndo ? (
            <button
              type="button"
              className="text-[11px] text-amber-200 underline-offset-2 hover:text-white hover:underline"
              onClick={onUndo}
              title="Back to what visitors see now"
            >
              Undo
            </button>
          ) : null}
          {!isEmpty(value) && spec.type !== "toggle" ? (
            <button
              type="button"
              className="text-[11px] text-slate-400 underline-offset-2 hover:text-white hover:underline"
              onClick={() => onChange(undefined)}
              title="Use the site's built-in text or image"
            >
              Reset to default
            </button>
          ) : null}
        </span>
      </div>
      {control}
      {extra}
    </div>
  );

  switch (spec.type) {
    case "text":
    case "richtext": {
      const long = spec.type === "richtext" || (spec.max ?? 0) > 120;
      const v = str(value);
      const common = {
        id,
        className: "input",
        value: v,
        maxLength: spec.max,
        placeholder: hint ? `Site default: ${hint}` : "Uses the site default",
      };
      return wrap(
        long ? (
          <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...common} onChange={(e) => onChange(e.target.value)} />
        ),
        spec.max ? (
          <p className="mt-1 text-right text-[11px] text-slate-500">
            {v.length}/{spec.max}
          </p>
        ) : null,
      );
    }
    case "url":
    case "path":
    case "link":
    case "email":
    case "tel":
      return wrap(
        <input
          id={id}
          className="input"
          type={spec.type === "email" ? "email" : spec.type === "tel" ? "tel" : "text"}
          value={str(value)}
          placeholder={
            hint
              ? `Site default: ${hint}`
              : spec.type === "path"
                ? "/page-on-this-site"
                : spec.type === "link"
                  ? "/jobs or https://…"
                  : "https://"
          }
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "image":
    case "video": {
      const v = str(value) || str(fallback);
      return wrap(
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-800">
            {v ? (
              spec.type === "image" ? (
                <img src={v} alt="" className="h-full w-full object-contain" />
              ) : (
                <video src={v} className="h-full w-full object-cover" muted />
              )
            ) : (
              <span className="text-[11px] text-slate-500">none</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <button
              id={id}
              type="button"
              className="btn-ghost"
              onClick={async () => {
                const url = await pickMedia(spec.type as "image" | "video");
                if (url) onChange(url);
              }}
            >
              Choose {spec.type}…
            </button>
            <p className="truncate text-[11px] text-slate-500">{str(value) || "Using the site default"}</p>
          </div>
        </div>,
      );
    }
    case "color": {
      const v = str(value) || str(fallback) || "#000000";
      return wrap(
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
            value={v}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            className="input font-mono"
            value={str(value)}
            placeholder="Site default"
            aria-label={`${spec.label} hex`}
            onChange={(e) => onChange(e.target.value.trim())}
          />
        </div>,
      );
    }
    case "font":
    case "select":
      return wrap(
        <select id={id} className="input" value={str(value)} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Site default{hint ? ` (${hint})` : ""}</option>
          {spec.options?.map((o) => (
            <option key={o} value={o} style={spec.type === "font" ? { fontFamily: o } : undefined}>
              {o}
            </option>
          ))}
        </select>,
      );
    case "toggle":
      return wrap(
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            id={id}
            type="checkbox"
            className="h-4 w-4 accent-violet-500"
            checked={value !== false}
            onChange={(e) => onChange(e.target.checked)}
          />
          {value !== false ? "On" : "Off"}
        </label>,
      );
    case "number": {
      const v = typeof value === "number" ? value : typeof fallback === "number" ? fallback : spec.min ?? 0;
      return wrap(
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="range"
            className="flex-1 accent-violet-500"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={v}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="w-20 text-right font-mono text-sm text-slate-300">
            {typeof value === "number" ? `${value}${spec.unit ?? ""}` : "default"}
          </span>
        </div>,
      );
    }
    case "list":
      return wrap(<ListEditor name={name} spec={spec} value={value} fallback={fallback} onChange={onChange} pickMedia={pickMedia} />);
    default:
      return null;
  }
}

function ListEditor({ name, spec, value, fallback, onChange, pickMedia }: Omit<Props, "highlight">) {
  const items = Array.isArray(value) ? (value as Value[]) : [];
  const defaults = Array.isArray(fallback) ? (fallback as Value[]) : [];
  const max = spec.max ?? 10;
  const set = (next: Value[]) => onChange(next);
  const move = (i: number, d: number) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    set(next);
  };

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 p-3 text-sm text-slate-400">
        <p>The site uses its built-in list{defaults.length ? ` (${defaults.length} items)` : ""}.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {defaults.length ? (
            <button type="button" className="btn-ghost" onClick={() => set(defaults.slice(0, max).map((d) => ({ ...d })))}>
              Edit the current list
            </button>
          ) : null}
          <button type="button" className="btn-ghost" onClick={() => set([{}])}>
            Start a new list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">#{i + 1}</span>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost min-h-[28px] px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button
                type="button"
                className="btn-ghost min-h-[28px] px-2"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="btn-ghost min-h-[28px] px-2 text-rose-300"
                onClick={() => set(items.filter((_, j) => j !== i))}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </div>
          {Object.entries(spec.item ?? {}).map(([field, fs]) => (
            <FieldEditor
              key={field}
              name={`${name}-${i}-${field}`}
              spec={fs}
              value={item[field]}
              onChange={(v) => set(items.map((it, j) => (j === i ? { ...it, [field]: v } : it)))}
              pickMedia={pickMedia}
            />
          ))}
        </div>
      ))}
      <button type="button" className="btn-ghost w-full" disabled={items.length >= max} onClick={() => set([...items, {}])}>
        + Add ({items.length}/{max})
      </button>
    </div>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { getContent, themeCss, themeFontsHref, type SiteContent } from "@/lib/siteContentCore";

/**
 * Hands published Site Studio content to client components, and turns the page
 * into the Studio's live preview when it is opened as `?studio=<token>` inside
 * the Studio's frame: drafts replace published values, unsaved edits stream in
 * as `rk:patch` messages, and clicking a marked element tells the Studio which
 * field it is (`rk:select`). Messages are only exchanged with the configured
 * Studio origin.
 */

const STUDIO_ORIGINS = (process.env.NEXT_PUBLIC_STUDIO_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

type Register = (key: string, defaults: Record<string, unknown>) => void;
const Ctx = createContext<SiteContent>({});
// In preview, components report their built-in defaults so the Studio can start an edit from what is live.
const RegisterCtx = createContext<Register | null>(null);

const PREVIEW_CSS =
  "[data-rk-edit]{cursor:pointer;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s}" +
  "[data-rk-edit]:hover{outline-color:#8b5cf6}[data-rk-selected]{outline:2px solid #8b5cf6!important}";

export function SiteContentProvider({ initial, children }: { initial: SiteContent; children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [preview, setPreview] = useState(false);
  const register = useMemo<Register | null>(
    () =>
      preview
        ? (key, defaults) => window.parent.postMessage({ type: "rk:defaults", key, value: defaults }, STUDIO_ORIGINS[0])
        : null,
    [preview],
  );

  useEffect(() => {
    const studio = STUDIO_ORIGINS[0];
    const token = new URLSearchParams(window.location.search).get("studio");
    if (!token || !studio || window.parent === window) return;
    setPreview(true);

    const post = (msg: Record<string, unknown>) => window.parent.postMessage(msg, studio);
    const loadDrafts = () =>
      fetch(`${window.location.origin}/api/v1/site-content/preview?token=${encodeURIComponent(token)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`preview ${r.status}`))))
        .then((json) => {
          if (json && typeof json.data === "object") setContent(json.data as SiteContent);
        })
        .catch(() => post({ type: "rk:error", message: "Preview link expired. Reload the Studio." }));

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== studio || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "rk:patch" && typeof e.data.key === "string") {
        setContent((prev) => ({ ...prev, [e.data.key]: e.data.value }));
      } else if (e.data.type === "rk:reload") {
        loadDrafts();
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-rk-edit]");
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll("[data-rk-selected]").forEach((n) => n.removeAttribute("data-rk-selected"));
      el.setAttribute("data-rk-selected", "");
      const r = el.getBoundingClientRect();
      post({ type: "rk:select", id: el.getAttribute("data-rk-edit"), rect: { x: r.x, y: r.y, width: r.width, height: r.height } });
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    loadDrafts().then(() => post({ type: "rk:ready", path: window.location.pathname }));
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const fontsHref = preview ? themeFontsHref(content) : null;
  return (
    <Ctx.Provider value={content}>
      <RegisterCtx.Provider value={register}>
        {preview ? (
          <>
            <style>{PREVIEW_CSS + themeCss(content)}</style>
            {fontsHref ? <link rel="stylesheet" href={fontsHref} /> : null}
          </>
        ) : null}
        {children}
      </RegisterCtx.Provider>
    </Ctx.Provider>
  );
}

/** A component's content for `key`: published (or draft, in preview) over its built-in defaults. */
export function useSiteContent<T extends Record<string, unknown>>(key: string, defaults: T): T {
  const content = useContext(Ctx);
  const register = useContext(RegisterCtx);
  // Defaults are module-level constants at every call site, so they never change identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => register?.(key, defaults), [register, key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getContent(content, key, defaults), [content, key]);
}

/** Wraps children in an element marked for the Studio's click-to-edit. Prefer spreading `editable(id)` onto an existing element. */
export function Editable({ id, as: Tag = "span", className, children }: { id: string; as?: ElementType; className?: string; children: ReactNode }) {
  return (
    <Tag data-rk-edit={id} className={className}>
      {children}
    </Tag>
  );
}

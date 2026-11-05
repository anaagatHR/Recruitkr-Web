import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ApiFail } from "./api";

type Toast = { id: number; text: string; kind: "ok" | "error"; details?: string[] };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"], details?: string[]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok", details?: string[]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind, details }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 9000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm shadow-xl ${t.kind === "error" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
            <p className="font-medium">{t.text}</p>
            {t.details?.length ? (
              <ul className="mt-1 list-disc pl-4 text-xs opacity-90">
                {t.details.slice(0, 6).map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** toast("Saved") or toast.error(err) */
export function useToast() {
  const push = useContext(ToastCtx);
  return {
    ok: (text: string) => push(text, "ok"),
    error: (err: unknown) =>
      err instanceof ApiFail ? push(err.message, "error", err.details) : push(err instanceof Error ? err.message : String(err), "error"),
  };
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card max-h-[90vh] w-full overflow-y-auto p-5 outline-none ${wide ? "max-w-4xl" : "max-w-lg"}`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
